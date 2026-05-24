part of 'generated.dart';

class GetUserByEmailVariablesBuilder {
  String email;

  final FirebaseDataConnect _dataConnect;
  GetUserByEmailVariablesBuilder(this._dataConnect, {required  this.email,});
  Deserializer<GetUserByEmailData> dataDeserializer = (dynamic json)  => GetUserByEmailData.fromJson(jsonDecode(json));
  Serializer<GetUserByEmailVariables> varsSerializer = (GetUserByEmailVariables vars) => jsonEncode(vars.toJson());
  Future<QueryResult<GetUserByEmailData, GetUserByEmailVariables>> execute() {
    return ref().execute();
  }

  QueryRef<GetUserByEmailData, GetUserByEmailVariables> ref() {
    GetUserByEmailVariables vars= GetUserByEmailVariables(email: email,);
    return _dataConnect.query("GetUserByEmail", dataDeserializer, varsSerializer, vars);
  }
}

@immutable
class GetUserByEmailUsers {
  final String id;
  final String displayName;
  final String email;
  final String role;
  GetUserByEmailUsers.fromJson(dynamic json):
  
  id = nativeFromJson<String>(json['id']),
  displayName = nativeFromJson<String>(json['displayName']),
  email = nativeFromJson<String>(json['email']),
  role = nativeFromJson<String>(json['role']);
  @override
  bool operator ==(Object other) {
    if(identical(this, other)) {
      return true;
    }
    if(other.runtimeType != runtimeType) {
      return false;
    }

    final GetUserByEmailUsers otherTyped = other as GetUserByEmailUsers;
    return id == otherTyped.id && 
    displayName == otherTyped.displayName && 
    email == otherTyped.email && 
    role == otherTyped.role;
    
  }
  @override
  int get hashCode => Object.hashAll([id.hashCode, displayName.hashCode, email.hashCode, role.hashCode]);
  

  Map<String, dynamic> toJson() {
    Map<String, dynamic> json = {};
    json['id'] = nativeToJson<String>(id);
    json['displayName'] = nativeToJson<String>(displayName);
    json['email'] = nativeToJson<String>(email);
    json['role'] = nativeToJson<String>(role);
    return json;
  }

  const GetUserByEmailUsers({
    required this.id,
    required this.displayName,
    required this.email,
    required this.role,
  });
}

@immutable
class GetUserByEmailData {
  final List<GetUserByEmailUsers> users;
  GetUserByEmailData.fromJson(dynamic json):
  
  users = (json['users'] as List<dynamic>)
        .map((e) => GetUserByEmailUsers.fromJson(e))
        .toList();
  @override
  bool operator ==(Object other) {
    if(identical(this, other)) {
      return true;
    }
    if(other.runtimeType != runtimeType) {
      return false;
    }

    final GetUserByEmailData otherTyped = other as GetUserByEmailData;
    return users == otherTyped.users;
    
  }
  @override
  int get hashCode => users.hashCode;
  

  Map<String, dynamic> toJson() {
    Map<String, dynamic> json = {};
    json['users'] = users.map((e) => e.toJson()).toList();
    return json;
  }

  const GetUserByEmailData({
    required this.users,
  });
}

@immutable
class GetUserByEmailVariables {
  final String email;
  @Deprecated('fromJson is deprecated for Variable classes as they are no longer required for deserialization.')
  GetUserByEmailVariables.fromJson(Map<String, dynamic> json):
  
  email = nativeFromJson<String>(json['email']);
  @override
  bool operator ==(Object other) {
    if(identical(this, other)) {
      return true;
    }
    if(other.runtimeType != runtimeType) {
      return false;
    }

    final GetUserByEmailVariables otherTyped = other as GetUserByEmailVariables;
    return email == otherTyped.email;
    
  }
  @override
  int get hashCode => email.hashCode;
  

  Map<String, dynamic> toJson() {
    Map<String, dynamic> json = {};
    json['email'] = nativeToJson<String>(email);
    return json;
  }

  const GetUserByEmailVariables({
    required this.email,
  });
}

