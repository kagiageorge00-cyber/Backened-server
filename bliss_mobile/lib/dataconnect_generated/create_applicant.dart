part of 'generated.dart';

class CreateApplicantVariablesBuilder {
  Timestamp applicationDate;
  String email;
  String firstName;
  String lastName;
  String resumeUrl;

  final FirebaseDataConnect _dataConnect;
  CreateApplicantVariablesBuilder(this._dataConnect, {required  this.applicationDate,required  this.email,required  this.firstName,required  this.lastName,required  this.resumeUrl,});
  Deserializer<CreateApplicantData> dataDeserializer = (dynamic json)  => CreateApplicantData.fromJson(jsonDecode(json));
  Serializer<CreateApplicantVariables> varsSerializer = (CreateApplicantVariables vars) => jsonEncode(vars.toJson());
  Future<OperationResult<CreateApplicantData, CreateApplicantVariables>> execute() {
    return ref().execute();
  }

  MutationRef<CreateApplicantData, CreateApplicantVariables> ref() {
    CreateApplicantVariables vars= CreateApplicantVariables(applicationDate: applicationDate,email: email,firstName: firstName,lastName: lastName,resumeUrl: resumeUrl,);
    return _dataConnect.mutation("CreateApplicant", dataDeserializer, varsSerializer, vars);
  }
}

@immutable
class CreateApplicantApplicantInsert {
  final String id;
  CreateApplicantApplicantInsert.fromJson(dynamic json):
  
  id = nativeFromJson<String>(json['id']);
  @override
  bool operator ==(Object other) {
    if(identical(this, other)) {
      return true;
    }
    if(other.runtimeType != runtimeType) {
      return false;
    }

    final CreateApplicantApplicantInsert otherTyped = other as CreateApplicantApplicantInsert;
    return id == otherTyped.id;
    
  }
  @override
  int get hashCode => id.hashCode;
  

  Map<String, dynamic> toJson() {
    Map<String, dynamic> json = {};
    json['id'] = nativeToJson<String>(id);
    return json;
  }

  const CreateApplicantApplicantInsert({
    required this.id,
  });
}

@immutable
class CreateApplicantData {
  final CreateApplicantApplicantInsert applicant_insert;
  CreateApplicantData.fromJson(dynamic json):
  
  applicant_insert = CreateApplicantApplicantInsert.fromJson(json['applicant_insert']);
  @override
  bool operator ==(Object other) {
    if(identical(this, other)) {
      return true;
    }
    if(other.runtimeType != runtimeType) {
      return false;
    }

    final CreateApplicantData otherTyped = other as CreateApplicantData;
    return applicant_insert == otherTyped.applicant_insert;
    
  }
  @override
  int get hashCode => applicant_insert.hashCode;
  

  Map<String, dynamic> toJson() {
    Map<String, dynamic> json = {};
    json['applicant_insert'] = applicant_insert.toJson();
    return json;
  }

  const CreateApplicantData({
    required this.applicant_insert,
  });
}

@immutable
class CreateApplicantVariables {
  final Timestamp applicationDate;
  final String email;
  final String firstName;
  final String lastName;
  final String resumeUrl;
  @Deprecated('fromJson is deprecated for Variable classes as they are no longer required for deserialization.')
  CreateApplicantVariables.fromJson(Map<String, dynamic> json):
  
  applicationDate = Timestamp.fromJson(json['applicationDate']),
  email = nativeFromJson<String>(json['email']),
  firstName = nativeFromJson<String>(json['firstName']),
  lastName = nativeFromJson<String>(json['lastName']),
  resumeUrl = nativeFromJson<String>(json['resumeUrl']);
  @override
  bool operator ==(Object other) {
    if(identical(this, other)) {
      return true;
    }
    if(other.runtimeType != runtimeType) {
      return false;
    }

    final CreateApplicantVariables otherTyped = other as CreateApplicantVariables;
    return applicationDate == otherTyped.applicationDate && 
    email == otherTyped.email && 
    firstName == otherTyped.firstName && 
    lastName == otherTyped.lastName && 
    resumeUrl == otherTyped.resumeUrl;
    
  }
  @override
  int get hashCode => Object.hashAll([applicationDate.hashCode, email.hashCode, firstName.hashCode, lastName.hashCode, resumeUrl.hashCode]);
  

  Map<String, dynamic> toJson() {
    Map<String, dynamic> json = {};
    json['applicationDate'] = applicationDate.toJson();
    json['email'] = nativeToJson<String>(email);
    json['firstName'] = nativeToJson<String>(firstName);
    json['lastName'] = nativeToJson<String>(lastName);
    json['resumeUrl'] = nativeToJson<String>(resumeUrl);
    return json;
  }

  const CreateApplicantVariables({
    required this.applicationDate,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.resumeUrl,
  });
}

