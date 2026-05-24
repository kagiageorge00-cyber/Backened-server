library;
import '../firebase_data_connect_shim.dart';
import 'package:flutter/foundation.dart';
import 'dart:convert';

part 'create_applicant.dart';

part 'list_job_postings.dart';

part 'update_application_status.dart';

part 'get_user_by_email.dart';







class ExampleConnector {
  
  
  CreateApplicantVariablesBuilder createApplicant ({required Timestamp applicationDate, required String email, required String firstName, required String lastName, required String resumeUrl, }) {
    return CreateApplicantVariablesBuilder(dataConnect, applicationDate: applicationDate,email: email,firstName: firstName,lastName: lastName,resumeUrl: resumeUrl,);
  }
  
  
  ListJobPostingsVariablesBuilder listJobPostings () {
    return ListJobPostingsVariablesBuilder(dataConnect, );
  }
  
  
  UpdateApplicationStatusVariablesBuilder updateApplicationStatus ({required String id, required String applicationStatus, }) {
    return UpdateApplicationStatusVariablesBuilder(dataConnect, id: id,applicationStatus: applicationStatus,);
  }
  
  
  GetUserByEmailVariablesBuilder getUserByEmail ({required String email, }) {
    return GetUserByEmailVariablesBuilder(dataConnect, email: email,);
  }
  

  static ConnectorConfig connectorConfig = ConnectorConfig(
    'us-east4',
    'example',
    'blissmobile',
  );

  ExampleConnector({required this.dataConnect});
  static ExampleConnector get instance {
    return ExampleConnector(
        dataConnect: FirebaseDataConnect.instanceFor(
            connectorConfig: connectorConfig,
            sdkType: CallerSDKType.generated));
  }

  FirebaseDataConnect dataConnect;
}
