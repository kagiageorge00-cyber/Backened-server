const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Employer = require('../models/Employer');
const Candidate = require('../models/candidate');
const Interview = require('../models/Interview');
const Deployment = require('../models/Deployment');
const Contract = require('../models/Contract');
const EmploymentRecord = require('../models/EmploymentRecord');
const Notification = require('../models/Notification');
const employerAuth = require('../middleware/employerAuth');
const { sendNotification } = require('../services/notificationservice');
const { generateContractPdf } = require('../services/contractService');
const { notifyCandidateInterviewRequest } = require('../services/notificationservice');

const router = express.Router();

function formatCandidateProfile(candidate) {
  const profile = {
    id: candidate.candidateId || candidate.uniqueCode || candidate._id.toString(),
    fullName: candidate.fullName || candidate.name || '',
    candidateCode: candidate.uniqueCode || candidate.candidateId || '',
    photoUrl: candidate.photoUrl || candidate.passportUrl || '',
    videoUrl: candidate.videoUrl || '',
    age: candidate.age || 0,
    gender: candidate.gender || '',
    nationality: candidate.nationality || '',
    currentCountry: candidate.country || candidate.destinationCountry || '',
    preferredCountry: candidate.preferredCountry || candidate.destinationCountry || '',
    preferredJob: candidate.jobPosition || candidate.jobAppliedFor || '',
    expectedSalary: candidate.expectedSalary || '',
    education: candidate.education || '',
    experience: candidate.experience || '',
    skills: candidate.skills || [],
    languages: candidate.languages || [],
    certificates: candidate.certificates || [],
    workHistory: candidate.workHistory || candidate.experience || '',
    achievements: candidate.achievements || '',
    references: candidate.references || [],
    availabilityStatus: candidate.status || candidate.availabilityStatus || 'available',
    verificationStatus: candidate.isVerified ? 'verified' : 'unverified',
    medicalStatus: candidate.medicalUrl ? 'verified' : 'pending',
    applicationHistory: candidate.applicationHistory || [],
    profileCompletion: candidate.profileCompletion || 0,
  };

  return profile;
}

router.get('/marketplace', employerAuth, async (req, res) => {
  try {
    const candidates = await Candidate.find({ status: 'available', isVerified: true })
      .select('fullName uniqueCode candidateId jobPosition destinationCountry preferredCountry expectedSalary age status photoUrl')
      .limit(50)
      .lean();

    const data = candidates.map((candidate) => ({
      id: candidate.candidateId || candidate.uniqueCode || candidate._id.toString(),
      fullName: candidate.fullName || '',
      candidateCode: candidate.uniqueCode || candidate.candidateId || '',
      preferredJobPosition: candidate.jobPosition || '',
      preferredCountry: candidate.preferredCountry || candidate.destinationCountry || '',
      expectedSalary: candidate.expectedSalary || '',
      age: candidate.age || 0,
      availabilityStatus: candidate.status || 'available',
      photoUrl: candidate.photoUrl || candidate.passportUrl || '',
    }));

    return res.json({ success: true, data, count: data.length });
  } catch (err) {
    console.error('Local marketplace error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/candidates/:id', employerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findOne({
      $or: [
        { candidateId: id },
        { uniqueCode: id },
        { _id: id },
        { phone: id },
        { email: id },
      ],
    }).lean();

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const profile = formatCandidateProfile(candidate);
    return res.json({ success: true, data: profile });
  } catch (err) {
    console.error('Local candidate profile error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/interviews', employerAuth, async (req, res) => {
  try {
    const employer = req.employer;
    const {
      candidateId,
      interviewDate,
      interviewTime,
      interviewType,
      meetingLink,
      notes,
      location,
    } = req.body;

    if (!candidateId || !interviewDate || !interviewTime || !interviewType) {
      return res.status(400).json({ success: false, error: 'candidateId, interviewDate, interviewTime, and interviewType are required' });
    }

    const candidate = await Candidate.findOne({
      $or: [{ candidateId }, { uniqueCode: candidateId }, { _id: candidateId }, { phone: candidateId }, { email: candidateId }],
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    if (candidate.status !== 'available') {
      return res.status(400).json({ success: false, error: 'Candidate is not available for interviews' });
    }

    const interviewId = `INT-${Date.now()}`;
    const interview = await Interview.create({
      interviewId,
      employerId: employer.employerId,
      candidateId: candidate.candidateId || candidate.uniqueCode || candidate._id.toString(),
      interviewDate: new Date(interviewDate),
      interviewTime,
      interviewType,
      meetingLink: meetingLink || '',
      notes,
      location,
      interviewStatus: 'requested',
      meetingStatus: 'scheduled',
      roomId: `room-${uuidv4()}`,
      channelName: `interview_${interviewId}`,
    });

    const notification = await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: candidate._id.toString(),
      userType: 'candidate',
      title: 'Interview Invitation',
      message: `You have been invited for an interview by ${employer.companyName || employer.fullName}.`,
      notificationType: 'interview',
      category: 'interview_invitation',
      entityType: 'interview',
      entityId: interviewId,
      actionUrl: `/candidate/interviews/${interviewId}`,
    });

    res.json({ success: true, interview, notification });
  } catch (err) {
    console.error('Local interview creation error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/interviews/:id/result', employerAuth, async (req, res) => {
  try {
    const employer = req.employer;
    const { id } = req.params;
    const { result } = req.body;

    if (!result || !['pass', 'fail'].includes(result)) {
      return res.status(400).json({ success: false, error: 'Result must be pass or fail' });
    }

    const interview = await Interview.findOne({ interviewId: id, employerId: employer.employerId });
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    const candidate = await Candidate.findOne({
      $or: [{ candidateId: interview.candidateId }, { uniqueCode: interview.candidateId }, { _id: interview.candidateId }, { phone: interview.candidateId }, { email: interview.candidateId }],
    });

    interview.interviewStatus = result === 'pass' ? 'passed' : 'failed';
    interview.meetingStatus = 'ended';
    await interview.save();

    if (candidate) {
      const nextStatus = result === 'pass' ? 'reserved' : 'available';
      candidate.status = nextStatus;
      await candidate.save();

      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: candidate._id.toString(),
        userType: 'candidate',
        title: result === 'pass' ? 'Interview Passed' : 'Interview Failed',
        message: result === 'pass'
          ? 'Congratulations, you have passed the interview and are reserved by the employer.'
          : 'Unfortunately, you were not selected after the interview.',
        notificationType: 'interview',
        category: 'interview_result',
        entityType: 'interview',
        entityId: id,
        actionUrl: `/candidate/interviews/${id}`,
      });
    }

    return res.json({ success: true, interview });
  } catch (err) {
    console.error('Interview result error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/deployment/payment', employerAuth, async (req, res) => {
  try {
    const employer = req.employer;
    const { interviewId, salary } = req.body;

    if (!interviewId || !salary) {
      return res.status(400).json({ success: false, error: 'interviewId and salary are required' });
    }

    const interview = await Interview.findOne({ interviewId, employerId: employer.employerId });
    if (!interview || interview.interviewStatus !== 'passed') {
      return res.status(400).json({ success: false, error: 'Interview must be passed before payment' });
    }

    const candidate = await Candidate.findOne({
      $or: [{ candidateId: interview.candidateId }, { uniqueCode: interview.candidateId }, { _id: interview.candidateId }, { phone: interview.candidateId }, { email: interview.candidateId }],
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const employerFee = Number(salary) * 0.5;
    const candidateFee = Number(salary) * 0.1;
    const totalDue = employerFee + candidateFee;

    const deploymentId = `DEP-${Date.now()}`;
    const deployment = await Deployment.create({
      deploymentId,
      employerId: employer.employerId,
      candidateId: candidate.candidateId || candidate.uniqueCode || candidate._id.toString(),
      candidateName: candidate.fullName || candidate.name || '',
      candidateCountry: candidate.country || candidate.destinationCountry || '',
      interviewId,
      deploymentFee: totalDue,
      paymentStatus: 'pending',
      paymentMethod: 'pending',
      referenceNumber: `REF-${Date.now()}`,
      currentStage: 'Payment',
      progress: 25,
      deploymentStatus: 'interview',
    });

    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: employer.employerId,
      userType: 'employer',
      title: 'Deployment payment requested',
      message: `Please pay the local deployment fee of ${totalDue} for ${candidate.fullName || 'the selected candidate'}.`,
      notificationType: 'payment',
      category: 'deployment_payment',
      entityType: 'deployment',
      entityId: deploymentId,
      actionUrl: `/employer/deployments/${deploymentId}`,
    });

    return res.status(201).json({
      success: true,
      deployment: {
        deploymentId,
        employerFee,
        candidateFee,
        totalDue,
        paymentStatus: deployment.paymentStatus,
      },
    });
  } catch (err) {
    console.error('Deployment payment error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/contracts/generate', employerAuth, async (req, res) => {
  try {
    const employer = req.employer;
    const {
      deploymentId,
      jobTitle,
      companyName,
      workLocation,
      country,
      city,
      salary,
      workingHours,
      workingDays,
      benefits,
      accommodation,
      transport,
      meals,
      leaveDays,
      contractDuration,
      probationPeriod,
      startDate,
      additionalTerms,
    } = req.body;

    if (!deploymentId || !jobTitle || !companyName || !salary || !startDate) {
      return res.status(400).json({ success: false, error: 'deploymentId, jobTitle, companyName, salary, and startDate are required' });
    }

    const deployment = await Deployment.findOne({ deploymentId, employerId: employer.employerId });
    if (!deployment) {
      return res.status(404).json({ success: false, error: 'Deployment not found' });
    }

    const contractId = `CNT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const contract = await Contract.create({
      contractId,
      deploymentId,
      employerId: employer.employerId,
      candidateId: deployment.candidateId,
      candidateName: deployment.candidateName,
      employerName: employer.companyName || employer.fullName,
      companyName,
      jobPosition: jobTitle,
      jobDescription: `${jobTitle} at ${companyName} in ${city}, ${country}`,
      jobCountry: country,
      salary: Number(salary),
      contractPeriodYears: 1,
      contractStatus: 'pending_employer_signature',
      contractUrl: `/uploads/contracts/${contractId}.pdf`,
    });

    // generate contract PDF and store to uploads/contracts
    try {
      const { filePath } = await generateContractPdf({
        contractId,
        employerName: contract.employerName,
        companyName,
        candidateName: deployment.candidateName,
        jobTitle,
        workLocation,
        country,
        city,
        salary: Number(salary),
        workingHours,
        workingDays,
        benefits,
        accommodation,
        transport,
        meals,
        leaveDays,
        contractDuration,
        probationPeriod,
        startDate,
        additionalTerms,
      });
      contract.contractUrl = filePath;
      await contract.save();
    } catch (pdfErr) {
      console.warn('Contract PDF generation failed:', pdfErr);
    }

    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: employer.employerId,
      userType: 'employer',
      title: 'Contract generated',
      message: `A contract has been generated for ${deployment.candidateName}.`,
      notificationType: 'contract',
      category: 'contract_generated',
      entityType: 'contract',
      entityId: contractId,
      actionUrl: `/employer/contracts/${contractId}`,
    });

    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: deployment.candidateId,
      userType: 'candidate',
      title: 'Employment contract ready',
      message: `An employment contract has been prepared for your review and signature.`,
      notificationType: 'contract',
      category: 'contract_generated',
      entityType: 'contract',
      entityId: contractId,
      actionUrl: `/candidate/contracts/${contractId}`,
    });

    return res.status(201).json({ success: true, contract });
  } catch (err) {
    console.error('Contract generation error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/contracts/sign', employerAuth, async (req, res) => {
  try {
    const { contractId, signatureType, signatureUrl } = req.body;
    if (!contractId || !signatureType || !signatureUrl) {
      return res.status(400).json({ success: false, error: 'contractId, signatureType, and signatureUrl are required' });
    }

    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }

    if (signatureType === 'employer') {
      if (contract.employerId !== req.employer.employerId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      contract.employerSignatureUrl = signatureUrl;
      contract.employerSigned = true;
      contract.employerSignedAt = new Date();
      contract.contractStatus = contract.candidateSigned ? 'signed' : 'pending_candidate_signature';
    } else if (signatureType === 'candidate') {
      contract.candidateSignatureUrl = signatureUrl;
      contract.candidateSigned = true;
      contract.candidateSignedAt = new Date();
      contract.contractStatus = contract.employerSigned ? 'signed' : 'pending_employer_signature';
    } else {
      return res.status(400).json({ success: false, error: 'signatureType must be employer or candidate' });
    }

    await contract.save();

    if (contract.employerSigned && contract.candidateSigned) {
      contract.contractStatus = 'signed';
      await contract.save();

      await Deployment.findOneAndUpdate(
        { deploymentId: contract.deploymentId },
        { currentStage: 'Contract Signed', deploymentStatus: 'contract_generated', progress: 80 },
        { new: true }
      );

      await Candidate.findOneAndUpdate(
        { $or: [{ candidateId: contract.candidateId }, { uniqueCode: contract.candidateId }, { _id: contract.candidateId }] },
        { contactReleased: true, status: 'contract_signed' }
      );
    }

    return res.json({ success: true, contract });
  } catch (err) {
    console.error('Contract sign error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/contracts/:id', employerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findOne({ contractId: id });
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }
    return res.json({ success: true, contract });
  } catch (err) {
    console.error('Contract fetch error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/notifications', employerAuth, async (req, res) => {
  try {
    const notes = await Notification.find({ userId: req.employer.employerId }).sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, data: notes });
  } catch (err) {
    console.error('Local notifications fetch error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
