const express = require('express');
const { randomUUID } = require('crypto');
const Candidate = require('../models/candidate');
const Interview = require('../models/Interview');
const Deployment = require('../models/Deployment');
const Contract = require('../models/Contract');
const Notification = require('../models/Notification');
const employerAuth = require('../middleware/employerAuth');
const { generateContractPdf } = require('../services/contractService');

const router = express.Router();

function normalizeCandidate(candidate) {
  return {
    id: candidate.candidateId || candidate.uniqueCode || candidate._id.toString(),
    fullName: candidate.fullName || candidate.name || '',
    candidateCode: candidate.uniqueCode || candidate.candidateId || '',
    country: candidate.country || '',
    destinationCountry: candidate.destinationCountry || '',
    preferredCountry: candidate.preferredCountry || candidate.destinationCountry || '',
    jobPosition: candidate.jobPosition || candidate.jobAppliedFor || '',
    expectedSalary: candidate.expectedSalary || '',
    status: candidate.status || 'available',
    isVerified: candidate.isVerified || false,
    photoUrl: candidate.photoUrl || candidate.passportUrl || '',
    videoUrl: candidate.videoUrl || '',
    visaStatus: candidate.visaStatus || 'not_started',
    contactReleased: candidate.contactReleased || false,
  };
}

router.get('/marketplace', employerAuth, async (req, res) => {
  try {
    const candidates = await Candidate.find({
      status: 'available',
      isVerified: true,
      destinationCountry: { $exists: true, $ne: '' },
    })
      .select('fullName uniqueCode candidateId jobPosition destinationCountry preferredCountry expectedSalary age status photoUrl')
      .limit(50)
      .lean();

    const data = candidates.map(normalizeCandidate);
    return res.json({ success: true, data, count: data.length });
  } catch (err) {
    console.error('International marketplace error:', err);
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

    return res.json({ success: true, data: normalizeCandidate(candidate) });
  } catch (err) {
    console.error('International candidate profile error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/interviews', employerAuth, async (req, res) => {
  try {
    const employer = req.employer;
    const { candidateId, interviewDate, interviewTime, interviewType, meetingLink, notes, location } = req.body;

    if (!candidateId || !interviewDate || !interviewTime || !interviewType) {
      return res.status(400).json({ success: false, error: 'candidateId, interviewDate, interviewTime, and interviewType are required' });
    }

    const candidate = await Candidate.findOne({
      $or: [{ candidateId }, { uniqueCode: candidateId }, { _id: candidateId }, { phone: candidateId }, { email: candidateId }],
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const interviewId = `INTL-${Date.now()}`;
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
      roomId: `room-${randomUUID()}`,
      channelName: `intl_interview_${interviewId}`,
    });

    const notification = await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: candidate._id.toString(),
      userType: 'candidate',
      title: 'International Interview Invitation',
      message: `You have been invited to an international interview by ${employer.companyName || employer.fullName}.`,
      notificationType: 'interview',
      category: 'international_interview',
      entityType: 'interview',
      entityId: interviewId,
      actionUrl: `/candidate/interviews/${interviewId}`,
    });

    return res.json({ success: true, interview, notification });
  } catch (err) {
    console.error('International interview creation error:', err);
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

    interview.interviewStatus = result === 'pass' ? 'passed' : 'failed';
    interview.meetingStatus = 'ended';
    await interview.save();

    const candidate = await Candidate.findOne({
      $or: [{ candidateId: interview.candidateId }, { uniqueCode: interview.candidateId }, { _id: interview.candidateId }, { phone: interview.candidateId }, { email: interview.candidateId }],
    });

    if (candidate) {
      candidate.status = result === 'pass' ? 'reserved' : 'available';
      await candidate.save();

      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: candidate._id.toString(),
        userType: 'candidate',
        title: result === 'pass' ? 'Interview Passed' : 'Interview Failed',
        message: result === 'pass'
          ? 'Congratulations, you passed the interview for an international placement.'
          : 'You were not selected for the international placement at this time.',
        notificationType: 'interview',
        category: 'international_interview_result',
        entityType: 'interview',
        entityId: id,
        actionUrl: `/candidate/interviews/${id}`,
      });
    }

    return res.json({ success: true, interview });
  } catch (err) {
    console.error('International interview result error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/deployment/payment', employerAuth, async (req, res) => {
  try {
    const employer = req.employer;
    const { interviewId, basicSalary, visaFee, flightTicketFee, relocationAllowance } = req.body;

    if (!interviewId || !basicSalary) {
      return res.status(400).json({ success: false, error: 'interviewId and basicSalary are required' });
    }

    const interview = await Interview.findOne({ interviewId, employerId: employer.employerId });
    if (!interview || interview.interviewStatus !== 'passed') {
      return res.status(400).json({ success: false, error: 'Interview must be passed before international deployment payment' });
    }

    const candidate = await Candidate.findOne({
      $or: [{ candidateId: interview.candidateId }, { uniqueCode: interview.candidateId }, { _id: interview.candidateId }, { phone: interview.candidateId }, { email: interview.candidateId }],
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const grossSalary = Number(basicSalary) || 0;
    const visaCharge = Number(visaFee) || 0;
    const ticketCharge = Number(flightTicketFee) || 0;
    const relocationCharge = Number(relocationAllowance) || 0;
    const isHousemaid = /housemaid/i.test(candidate.jobPosition || '') || /housemaid/i.test(candidate.jobAppliedFor || '');
    const employerCountry = (employer.country || '').toLowerCase();
    const isLebanonEmployer = employerCountry === 'lebanon';

    let employerFee;
    let candidateFee;
    let totalDue;
    let fixedVisaCharge = visaCharge;
    let fixedTicketCharge = ticketCharge;
    let fixedRelocationCharge = relocationCharge;

    if (isLebanonEmployer) {
      // Lebanon employers pay a fixed USD 2500 deployment fee due to high boarding cost.
      employerFee = 2500;
      candidateFee = 0;
      totalDue = 2500;
      fixedVisaCharge = 0;
      fixedTicketCharge = 0;
      fixedRelocationCharge = 0;
    } else if (isHousemaid) {
      // For international housemaid placements, the deployment fee is a fixed USD 1000.
      employerFee = 1000;
      candidateFee = 0;
      totalDue = 1000;
      fixedVisaCharge = 0;
      fixedTicketCharge = 0;
      fixedRelocationCharge = 0;
    } else {
      employerFee = grossSalary * 0.8;
      candidateFee = grossSalary * 0.15;
      totalDue = employerFee + candidateFee + visaCharge + ticketCharge + relocationCharge;
    }

    const deploymentId = `INTDEP-${Date.now()}`;
    const deployment = await Deployment.create({
      deploymentId,
      employerId: employer.employerId,
      candidateId: candidate.candidateId || candidate.uniqueCode || candidate._id.toString(),
      candidateName: candidate.fullName || candidate.name || '',
      candidateCountry: candidate.country || '',
      destinationCountry: candidate.destinationCountry || '',
      interviewId,
      deploymentFee: totalDue,
      paymentStatus: 'pending',
      paymentMethod: 'bank_transfer',
      referenceNumber: `REF-${Date.now()}`,
      currentStage: 'Visa & Deployment Payment',
      progress: 20,
      deploymentStatus: 'international',
      visaFee: fixedVisaCharge,
      flightTicketFee: fixedTicketCharge,
      relocationAllowance: fixedRelocationCharge,
      employerFee,
      candidateFee,
    });

    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: employer.employerId,
      userType: 'employer',
      title: 'International deployment payment requested',
      message: `Please complete international deployment payment of ${totalDue} for ${candidate.fullName || 'your selected candidate'}.`,
      notificationType: 'payment',
      category: 'international_deployment_payment',
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
        visaFee: visaCharge,
        flightTicketFee: ticketCharge,
        relocationAllowance: relocationCharge,
        totalDue,
        paymentStatus: deployment.paymentStatus,
      },
    });
  } catch (err) {
    console.error('International deployment payment error:', err);
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
      visaType,
      visaDuration,
      flightDetails,
      additionalTerms,
    } = req.body;

    if (!deploymentId || !jobTitle || !companyName || !salary || !startDate) {
      return res.status(400).json({ success: false, error: 'deploymentId, jobTitle, companyName, salary, and startDate are required' });
    }

    const deployment = await Deployment.findOne({ deploymentId, employerId: employer.employerId });
    if (!deployment) {
      return res.status(404).json({ success: false, error: 'Deployment not found' });
    }

    const contractId = `INTCNT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
      contractPeriodYears: 2,
      contractStatus: 'pending_employer_signature',
      contractUrl: `/uploads/contracts/${contractId}.pdf`,
      visaType,
      visaDuration,
      flightDetails,
      additionalTerms,
    });

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
        specialTerms: additionalTerms,
      });
      contract.contractUrl = filePath;
      await contract.save();
    } catch (pdfErr) {
      console.warn('International contract PDF generation failed:', pdfErr);
    }

    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: employer.employerId,
      userType: 'employer',
      title: 'International contract generated',
      message: `An international employment contract has been prepared for ${deployment.candidateName}.`,
      notificationType: 'contract',
      category: 'international_contract_generated',
      entityType: 'contract',
      entityId: contractId,
      actionUrl: `/employer/contracts/${contractId}`,
    });

    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: deployment.candidateId,
      userType: 'candidate',
      title: 'International contract ready',
      message: `Your international employment contract is ready for review and signature.`,
      notificationType: 'contract',
      category: 'international_contract_generated',
      entityType: 'contract',
      entityId: contractId,
      actionUrl: `/candidate/contracts/${contractId}`,
    });

    return res.status(201).json({ success: true, contract });
  } catch (err) {
    console.error('International contract generation error:', err);
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
        { currentStage: 'Contract Signed', deploymentStatus: 'contract_generated', progress: 85 },
        { new: true }
      );

      await Candidate.findOneAndUpdate(
        { $or: [{ candidateId: contract.candidateId }, { uniqueCode: contract.candidateId }, { _id: contract.candidateId }] },
        { contactReleased: true, status: 'contract_signed' }
      );
    }

    return res.json({ success: true, contract });
  } catch (err) {
    console.error('International contract sign error:', err);
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
    console.error('International contract fetch error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/notifications', employerAuth, async (req, res) => {
  try {
    const notes = await Notification.find({ userId: req.employer.employerId }).sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, data: notes });
  } catch (err) {
    console.error('International notifications fetch error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
