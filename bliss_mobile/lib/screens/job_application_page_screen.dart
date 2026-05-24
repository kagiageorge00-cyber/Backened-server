import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import '../../models/candidate_model.dart';
import 'job_application_payment_screen.dart';

class JobApplicationPageScreen extends StatefulWidget {
  static const routeName = '/jobApplication';

  const JobApplicationPageScreen({super.key});

  @override
  State<JobApplicationPageScreen> createState() =>
      _JobApplicationPageScreenState();
}

class _JobApplicationPageScreenState extends State<JobApplicationPageScreen> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final TextEditingController _fullNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passportController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _positionController = TextEditingController();
  final TextEditingController _salaryController = TextEditingController();
  final TextEditingController _childrenController = TextEditingController();
  final TextEditingController _skillsController = TextEditingController();
  final TextEditingController _experienceController = TextEditingController();
  final TextEditingController _photoUrlController = TextEditingController();

  // Dropdown selections
  String? _selectedCountry;
  String? _selectedCurrency;
  String? _selectedMaritalStatus;
  String? _selectedJobCategory;
  String? _selectedGender;
  String? _selectedVisaOption;
  String? _selectedCountryCode;

  final List<String> countries = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Costa Rica",
    "Côte d'Ivoire",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Democratic Republic of the Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kosovo",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe"
  ];

  final List<String> currencies = [
    "AED",
    "AFN",
    "ALL",
    "AMD",
    "ANG",
    "AOA",
    "ARS",
    "AUD",
    "AWG",
    "AZN",
    "BAM",
    "BBD",
    "BDT",
    "BGN",
    "BHD",
    "BIF",
    "BMD",
    "BND",
    "BOB",
    "BRL",
    "BSD",
    "BTN",
    "BWP",
    "BYN",
    "BZD",
    "CAD",
    "CDF",
    "CHF",
    "CLP",
    "CNY",
    "COP",
    "CRC",
    "CUP",
    "CVE",
    "CZK",
    "DJF",
    "DKK",
    "DOP",
    "DZD",
    "EGP",
    "ERN",
    "ETB",
    "EUR",
    "FJD",
    "FKP",
    "GBP",
    "GEL",
    "GHS",
    "GIP",
    "GMD",
    "GNF",
    "GTQ",
    "GYD",
    "HKD",
    "HNL",
    "HRK",
    "HTG",
    "HUF",
    "IDR",
    "ILS",
    "INR",
    "IQD",
    "IRR",
    "ISK",
    "JMD",
    "JOD",
    "JPY",
    "KES",
    "KGS",
    "KHR",
    "KMF",
    "KPW",
    "KRW",
    "KWD",
    "KYD",
    "KZT",
    "LAK",
    "LBP",
    "LKR",
    "LRD",
    "LSL",
    "LYD",
    "MAD",
    "MDL",
    "MGA",
    "MKD",
    "MMK",
    "MNT",
    "MOP",
    "MRU",
    "MUR",
    "MVR",
    "MWK",
    "MXN",
    "MYR",
    "MZN",
    "NAD",
    "NGN",
    "NIO",
    "NOK",
    "NPR",
    "NZD",
    "OMR",
    "PAB",
    "PEN",
    "PGK",
    "PHP",
    "PKR",
    "PLN",
    "PYG",
    "QAR",
    "RON",
    "RSD",
    "RUB",
    "RWF",
    "SAR",
    "SBD",
    "SCR",
    "SDG",
    "SEK",
    "SGD",
    "SHP",
    "SLL",
    "SOS",
    "SRD",
    "SSP",
    "STN",
    "SYP",
    "SZL",
    "THB",
    "TJS",
    "TMT",
    "TND",
    "TOP",
    "TRY",
    "TTD",
    "TWD",
    "TZS",
    "UAH",
    "UGX",
    "USD",
    "UYU",
    "UZS",
    "VES",
    "VND",
    "VUV",
    "WST",
    "XAF",
    "XCD",
    "XOF",
    "XPF",
    "YER",
    "ZAR",
    "ZMW",
    "ZWL"
  ];

  final List<String> countryCodes = [
    "+1",
    "+7",
    "+20",
    "+27",
    "+30",
    "+31",
    "+32",
    "+33",
    "+34",
    "+36",
    "+39",
    "+40",
    "+41",
    "+43",
    "+44",
    "+45",
    "+46",
    "+47",
    "+48",
    "+49",
    "+51",
    "+52",
    "+53",
    "+54",
    "+55",
    "+56",
    "+57",
    "+58",
    "+60",
    "+61",
    "+62",
    "+63",
    "+64",
    "+65",
    "+66",
    "+81",
    "+82",
    "+84",
    "+86",
    "+90",
    "+91",
    "+92",
    "+93",
    "+94",
    "+95",
    "+98",
    "+212",
    "+213",
    "+216",
    "+218",
    "+220",
    "+221",
    "+222",
    "+223",
    "+224",
    "+225",
    "+226",
    "+227",
    "+228",
    "+229",
    "+230",
    "+231",
    "+232",
    "+233",
    "+234",
    "+235",
    "+236",
    "+237",
    "+238",
    "+239",
    "+240",
    "+241",
    "+242",
    "+243",
    "+244",
    "+245",
    "+246",
    "+247",
    "+248",
    "+249",
    "+250",
    "+251",
    "+252",
    "+253",
    "+254",
    "+255",
    "+256",
    "+257",
    "+258",
    "+260",
    "+261",
    "+262",
    "+263",
    "+264",
    "+265",
    "+266",
    "+267",
    "+268",
    "+269",
    "+290",
    "+291",
    "+297",
    "+298",
    "+299",
    "+350",
    "+351",
    "+352",
    "+353",
    "+354",
    "+355",
    "+356",
    "+357",
    "+358",
    "+359",
    "+370",
    "+371",
    "+372",
    "+373",
    "+374",
    "+375",
    "+376",
    "+377",
    "+378",
    "+380",
    "+381",
    "+382",
    "+383",
    "+385",
    "+386",
    "+387",
    "+389",
    "+420",
    "+421",
    "+423",
    "+501",
    "+502",
    "+503",
    "+504",
    "+505",
    "+506",
    "+507",
    "+508",
    "+509",
    "+590",
    "+591",
    "+592",
    "+593",
    "+594",
    "+595",
    "+596",
    "+597",
    "+598",
    "+599",
    "+670",
    "+672",
    "+673",
    "+674",
    "+675",
    "+676",
    "+677",
    "+678",
    "+679",
    "+680",
    "+681",
    "+682",
    "+683",
    "+685",
    "+686",
    "+687",
    "+688",
    "+689",
    "+690",
    "+691",
    "+692",
    "+850",
    "+852",
    "+853",
    "+855",
    "+856",
    "+870",
    "+880",
    "+886",
    "+960",
    "+961",
    "+962",
    "+963",
    "+964",
    "+965",
    "+966",
    "+967",
    "+968",
    "+970",
    "+971",
    "+972",
    "+973",
    "+974",
    "+975",
    "+976",
    "+977",
    "+992",
    "+993",
    "+994",
    "+995",
    "+996",
    "+998"
  ];

  final List<String> maritalStatusOptions = [
    "Single",
    "Married",
    "Divorced",
    "Widowed"
  ];
  final List<String> jobCategories = ["Local Job", "International Job"];
  final List<String> genders = ["Male", "Female"];
  final List<String> visaOptions = ["Work Visa", "No Visa Needed"];

  Color get _brandColor => Theme.of(context).colorScheme.primary;

  double _calculateProgress() {
    int filled = 0;
    final fields = [
      _fullNameController.text,
      _emailController.text,
      _phoneController.text,
      _positionController.text,
      _salaryController.text,
      _skillsController.text,
      _selectedVisaOption ?? '',
      _selectedJobCategory ?? '',
      _selectedCountry ?? '',
    ];
    for (final f in fields) {
      if (f.trim().isNotEmpty) filled++;
    }
    return (filled / fields.length).clamp(0, 1).toDouble();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passportController.dispose();
    _addressController.dispose();
    _positionController.dispose();
    _salaryController.dispose();
    _childrenController.dispose();
    _skillsController.dispose();
    _experienceController.dispose();
    _photoUrlController.dispose();
    super.dispose();
  }

  Future<void> _goToPayment() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedJobCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Select a job category (Local/International).')));
      return;
    }

    final candidateId = 'C${DateTime.now().millisecondsSinceEpoch}';
    final candidate = Candidate(
      id: candidateId,
      fullName: _fullNameController.text.trim(),
      age: 25,
      gender: _selectedGender ?? "Not specified",
      country: _selectedCountry ?? "Unknown",
      expectedSalary: double.tryParse(_salaryController.text.trim()) ?? 0,
      hireCost: 10.0,
      skills: _skillsController.text.split(',').map((s) => s.trim()).toList(),
      experienceYears: int.tryParse(_experienceController.text.trim()) ?? 0,
      photoUrl: _photoUrlController.text.trim(),
      passportStatus: _passportController.text.trim(),
      visaOption: _selectedVisaOption ?? "Not selected",
      currency: _selectedCurrency ?? "USD",
      phone: _phoneController.text.trim(),
      email: _emailController.text.trim(),
      feePaid: false,
      medicalBooked: false,
      jobApplied: _selectedJobCategory ?? "Not selected",
    );

    final paymentResult = await Navigator.push<bool?>(
      context,
      MaterialPageRoute(
        builder: (_) => JobApplicationPaymentScreen(
          candidateId: candidate.id,
          jobId: 'MARKETPLACE_${candidate.country}_${candidate.jobApplied}',
        ),
      ),
    );

    if (paymentResult == true) {
      final candidateData = {
        'id': candidate.id,
        'fullName': candidate.fullName,
        'country': candidate.country,
        'expectedSalary': candidate.expectedSalary,
        'skills': candidate.skills,
        'experienceYears': candidate.experienceYears,
        'photoUrl': candidate.photoUrl,
        'passportStatus': candidate.passportStatus,
        'visaOption': candidate.visaOption,
        'currency': candidate.currency,
        'phone': candidate.phone,
        'email': candidate.email,
        'jobApplied': candidate.jobApplied,
        'jobType': _selectedJobCategory,
        'createdAt': FieldValue.serverTimestamp(),
      };
      await FirebaseFirestore.instance
          .collection('candidates_marketplace')
          .doc(candidate.id)
          .set(candidateData);

      final applicationId = 'A${DateTime.now().millisecondsSinceEpoch}';
      await FirebaseFirestore.instance
          .collection('applications')
          .doc(applicationId)
          .set({
        'candidateId': candidate.id,
        'candidateName': candidate.fullName,
        'jobId': 'MARKETPLACE_${candidate.country}_${candidate.jobApplied}',
        'jobTitle': _positionController.text.trim().isNotEmpty
            ? _positionController.text.trim()
            : 'General ${_selectedJobCategory ?? 'Role'}',
        'employerId': 'OPEN_JOB_MARKET',
        'employerName': 'Bliss Connect',
        'applicationPaid': true,
        'applicationDate': FieldValue.serverTimestamp(),
        'applicationStatus': 'Pending',
        'interviewScheduled': false,
        'interviewDate': null,
        'interviewStatus': 'Pending',
        'isHired': false,
        'hireFeesPaid': false,
        'hireDate': null,
        'documents': {},
        'jobCategory': _selectedJobCategory,
      });

      if (!mounted) return;
      showDialog<void>(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: const Text('Application Submitted'),
            content: const Text(
                'Your application has been submitted and added to the candidate marketplace. You can track status in your portal.'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  Navigator.pushNamed(context, '/jobMarketplace');
                },
                child: const Text('View Marketplace'),
              ),
            ],
          );
        },
      );
    }
  }

  void _showFeeExplanation() {
    showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (context) {
        return AlertDialog(
          title: const Text('Why the \$10 registration fee?'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                    'A small, one-time registration fee helps us ensure a high-quality hiring experience for candidates and employers.'),
                SizedBox(height: 12),
                ListTile(
                  leading: Icon(Icons.verified, color: Colors.green),
                  title: Text('Verified profiles'),
                  subtitle: Text(
                      'We validate key details so employers can trust your application.'),
                ),
                ListTile(
                  leading: Icon(Icons.trending_up, color: Colors.orange),
                  title: Text('Priority visibility'),
                  subtitle: Text(
                      'Your profile is highlighted to employers, increasing interview requests.'),
                ),
                ListTile(
                  leading: Icon(Icons.security, color: Colors.blue),
                  title: Text('Secure processing'),
                  subtitle: Text(
                      'Payments are processed securely and used to support verification and platform services.'),
                ),
                ListTile(
                  leading: Icon(Icons.support, color: Colors.purple),
                  title: Text('Dedicated support'),
                  subtitle: Text(
                      'Access to faster candidate support and assistance during the hiring process.'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Maybe later'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _goToPayment();
              },
              child: const Text('Proceed to Payment'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final progress = _calculateProgress();
    return Scaffold(
      appBar: AppBar(
        backgroundColor: _brandColor,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 72, width: 72),
            SizedBox(width: 8),
            Text("Apply — Complete Your Profile"),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header card with progress (brand themed)
              Card(
                elevation: 3,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.secondary,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Text('Finish your application',
                              style: TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text(
                          'Complete these details to improve your chance of being selected.'),
                      const SizedBox(height: 12),
                      LinearProgressIndicator(
                          value: progress,
                          color: Theme.of(context).colorScheme.primary,
                          backgroundColor: Colors.grey.shade200),
                      const SizedBox(height: 8),
                      Text('${(progress * 100).round()}% complete',
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Personal section
              const Text('Personal Details',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              _buildTextField(_fullNameController, 'Full Name',
                  icon: Icons.person),
              const SizedBox(height: 10),
              _buildTextField(_emailController, 'Email',
                  keyboardType: TextInputType.emailAddress, icon: Icons.email),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(
                    child: _buildDropdown(
                        'Country Code',
                        countryCodes,
                        _selectedCountryCode,
                        (val) => setState(() => _selectedCountryCode = val))),
                const SizedBox(width: 10),
                Expanded(
                    child: _buildTextField(_phoneController, 'Phone Number',
                        keyboardType: TextInputType.phone, icon: Icons.phone)),
              ]),
              const SizedBox(height: 12),

              // Work details
              const Text('Work Details',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              _buildTextField(_positionController, 'Position Applied',
                  icon: Icons.work_outline),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(
                    child: _buildTextField(_salaryController, 'Expected Salary',
                        keyboardType: TextInputType.number,
                        icon: Icons.monetization_on_outlined)),
                const SizedBox(width: 10),
                Expanded(
                    child: _buildDropdown(
                        'Currency',
                        currencies,
                        _selectedCurrency,
                        (val) => setState(() => _selectedCurrency = val))),
              ]),
              const SizedBox(height: 10),
              _buildDropdown(
                  'Select Country Applied',
                  countries,
                  _selectedCountry,
                  (val) => setState(() => _selectedCountry = val)),
              const SizedBox(height: 12),

              // Experience & skills
              const Text('Experience & Skills',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              _buildTextField(_experienceController, 'Years of Experience',
                  keyboardType: TextInputType.number, icon: Icons.timer),
              const SizedBox(height: 10),
              _buildTextField(
                  _skillsController, 'Core Skills (comma separated)',
                  icon: Icons.build_outlined),
              const SizedBox(height: 12),

              // Additional
              Row(children: [
                Expanded(
                    child: _buildDropdown(
                        'Marital Status',
                        maritalStatusOptions,
                        _selectedMaritalStatus,
                        (val) => setState(() => _selectedMaritalStatus = val))),
                const SizedBox(width: 10),
                Expanded(
                    child: _buildTextField(
                        _childrenController, 'Number of Children',
                        keyboardType: TextInputType.number,
                        icon: Icons.family_restroom)),
              ]),
              const SizedBox(height: 12),
              _buildDropdown('Visa Option', visaOptions, _selectedVisaOption,
                  (val) => setState(() => _selectedVisaOption = val)),
              const SizedBox(height: 10),
              _buildDropdown(
                  'Job Category',
                  jobCategories,
                  _selectedJobCategory,
                  (val) => setState(() => _selectedJobCategory = val)),
              const SizedBox(height: 6),
              Text(
                'Select Local if you are applying for a role inside your country. Select International for visa-assisted overseas jobs.',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
              ),
              const SizedBox(height: 18),

              // Privacy note
              Row(children: [
                Icon(Icons.lock_outline, color: Colors.grey.shade700),
                const SizedBox(width: 8),
                Expanded(
                    child: Text(
                        'Your data is used only for recruitment. By proceeding you agree to our terms.',
                        style: TextStyle(color: Colors.grey.shade700))),
              ]),
              const SizedBox(height: 16),

              // Submit
              SizedBox(
                height: 54,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                      backgroundColor: _brandColor,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10))),
                  onPressed: _showFeeExplanation,
                  child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.lock),
                        SizedBox(width: 8),
                        Text('Proceed to Secure Payment — \$10',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w600))
                      ]),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label,
      {TextInputType keyboardType = TextInputType.text, IconData? icon}) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: (value) =>
          value == null || value.isEmpty ? "Please enter $label" : null,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: icon != null ? Icon(icon) : null,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding:
            const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      ),
    );
  }

  Widget _buildDropdown(String label, List<String> items, String? selectedValue,
      Function(String?) onChanged) {
    return DropdownButtonFormField<String>(
      initialValue: selectedValue,
      items:
          items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
      validator: (value) =>
          value == null || value.isEmpty ? "Please select $label" : null,
    );
  }
}
