part of 'generated.dart';

class UpdateApplicationStatusVariablesBuilder {
  String id;
  String applicationStatus;

  final FirebaseDataConnect _dataConnect;
  UpdateApplicationStatusVariablesBuilder(this._dataConnect, {required  this.id,required  this.applicationStatus,});
  Deserializer<UpdateApplicationStatusData> dataDeserializer = (dynamic json)  => UpdateApplicationStatusData.fromJson(jsonDecode(json));
  Serializer<UpdateApplicationStatusVariables> varsSerializer = (UpdateApplicationStatusVariables vars) => jsonEncode(vars.toJson());
  Future<OperationResult<UpdateApplicationStatusData, UpdateApplicationStatusVariables>> execute() {
    return ref().execute();
  }

  MutationRef<UpdateApplicationStatusData, UpdateApplicationStatusVariables> ref() {
    UpdateApplicationStatusVariables vars= UpdateApplicationStatusVariables(id: id,applicationStatus: applicationStatus,);
    return _dataConnect.mutation("UpdateApplicationStatus", dataDeserializer, varsSerializer, vars);
  }
}

@immutable
class UpdateApplicationStatusApplicationUpdate {
  final String id;
  UpdateApplicationStatusApplicationUpdate.fromJson(dynamic json):
  
  id = nativeFromJson<String>(json['id']);
  @override
  bool operator ==(Object other) {
    if(identical(this, other)) {
      return true;
    }
    if(other.runtimeType != runtimeType) {
      return false;
    }

    final UpdateApplicationStatusApplicationUpdate otherTyped = other as UpdateApplicationStatusApplicationUpdate;
    return id == otherTyped.id;
    
  }
  @override
  int get hashCode => id.hashCode;
  

  Map<String, dynamic> toJson() {
    Map<String, dynamic> json = {};
    json['id'] = nativeToJson<String>(id);
    return json;
  }

  const UpdateApplicationStatusApplicationUpdate({
    required this.id,
  });
}

@immutable
class UpdateApplicationStatusData {
  final UpdateApplicationStatusApplicationUpdate? application_update;
  UpdateApplicationStatusData.fromJson(dynamic json):
  
  application_update = json['application_update'] == null ? null : UpdateApplicationStatusApplicationUpdate.fromJson(json['application_update']);
  @override
  bool operator ==(Object other) {
    if(identical(this, other)) {
      return true;
    }
    if(other.runtimeType != runtimeType) {
      return false;
    }

    final UpdateApplicationStatusData otherTyped = other as UpdateApplicationStatusData;
    return application_update == otherTyped.application_update;
    
  }
  @override
  int get hashCode => application_update.hashCode;
  

  Map<String, dynamic> toJson() {
    Map<String, dynamic> json = {};
    if (application_update != null) {
      json['application_update'] = application_update!.toJson();
    }
    return json;
  }

  const UpdateApplicationStatusData({
    this.application_update,
  });
}

@immutable
class UpdateApplicationStatusVariables {
  final String id;
  final String applicationStatus;
  @Deprecated('fromJson is deprecated for Variable classes as they are no longer required for deserialization.')
  UpdateApplicationStatusVariables.fromJson(Map<String, dynamic> json):
  
  id = nativeFromJson<String>(json['id']),
  applicationStatus = nativeFromJson<String>(json['applicationStatus']);
  @override
  bool operator ==(Object other) {
    if(identical(this, other)) {
      return true;
    }
    if(other.runtimeType != runtimeType) {
      return false;
    }

    final UpdateApplicationStatusVariables otherTyped = other as UpdateApplicationStatusVariables;
    return id == otherTyped.id && 
    applicationStatus == otherTyped.applicationStatus;
    
  }
  @override
  int get hashCode => Object.hashAll([id.hashCode, applicationStatus.hashCode]);
  

  Map<String, dynamic> toJson() {
    Map<String, dynamic> json = {};
    json['id'] = nativeToJson<String>(id);
    json['applicationStatus'] = nativeToJson<String>(applicationStatus);
    return json;
  }

  const UpdateApplicationStatusVariables({
    required this.id,
    required this.applicationStatus,
  });
}

