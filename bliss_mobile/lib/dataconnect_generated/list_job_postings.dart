part of 'generated.dart';

class ListJobPostingsVariablesBuilder {
  
  final FirebaseDataConnect _dataConnect;
  ListJobPostingsVariablesBuilder(this._dataConnect, );
  Deserializer<ListJobPostingsData> dataDeserializer = (dynamic json)  => ListJobPostingsData.fromJson(jsonDecode(json));
  
  Future<QueryResult<ListJobPostingsData, void>> execute() {
    return ref().execute();
  }

  QueryRef<ListJobPostingsData, void> ref() {
    
    return _dataConnect.query("ListJobPostings", dataDeserializer, emptySerializer, null);
  }
}

@immutable
class ListJobPostingsJobPostings {
  final String id;
  final String title;
  final String description;
  final ListJobPostingsJobPostingsCompany company;
  ListJobPostingsJobPostings.fromJson(dynamic json):
  
  id = nativeFromJson<String>(json['id']),
  title = nativeFromJson<String>(json['title']),
  description = nativeFromJson<String>(json['description']),
  company = ListJobPostingsJobPostingsCompany.fromJson(json['company']);
  @override
  bool operator ==(Object other) {
    if(identical(this, other)) {
      return true;
    }
    if(other.runtimeType != runtimeType) {
      return false;
    }

    final ListJobPostingsJobPostings otherTyped = other as ListJobPostingsJobPostings;
    return id == otherTyped.id && 
    title == otherTyped.title && 
    description == otherTyped.description && 
    company == otherTyped.company;
    
  }
  @override
  int get hashCode => Object.hashAll([id.hashCode, title.hashCode, description.hashCode, company.hashCode]);
  

  Map<String, dynamic> toJson() {
    Map<String, dynamic> json = {};
    json['id'] = nativeToJson<String>(id);
    json['title'] = nativeToJson<String>(title);
    json['description'] = nativeToJson<String>(description);
    json['company'] = company.toJson();
    return json;
  }

  const ListJobPostingsJobPostings({
    required this.id,
    required this.title,
    required this.description,
    required this.company,
  });
}

@immutable
class ListJobPostingsJobPostingsCompany {
  final String name;
  ListJobPostingsJobPostingsCompany.fromJson(dynamic json):
  
  name = nativeFromJson<String>(json['name']);
  @override
  bool operator ==(Object other) {
    if(identical(this, other)) {
      return true;
    }
    if(other.runtimeType != runtimeType) {
      return false;
    }

    final ListJobPostingsJobPostingsCompany otherTyped = other as ListJobPostingsJobPostingsCompany;
    return name == otherTyped.name;
    
  }
  @override
  int get hashCode => name.hashCode;
  

  Map<String, dynamic> toJson() {
    Map<String, dynamic> json = {};
    json['name'] = nativeToJson<String>(name);
    return json;
  }

  const ListJobPostingsJobPostingsCompany({
    required this.name,
  });
}

@immutable
class ListJobPostingsData {
  final List<ListJobPostingsJobPostings> jobPostings;
  ListJobPostingsData.fromJson(dynamic json):
  
  jobPostings = (json['jobPostings'] as List<dynamic>)
        .map((e) => ListJobPostingsJobPostings.fromJson(e))
        .toList();
  @override
  bool operator ==(Object other) {
    if(identical(this, other)) {
      return true;
    }
    if(other.runtimeType != runtimeType) {
      return false;
    }

    final ListJobPostingsData otherTyped = other as ListJobPostingsData;
    return jobPostings == otherTyped.jobPostings;
    
  }
  @override
  int get hashCode => jobPostings.hashCode;
  

  Map<String, dynamic> toJson() {
    Map<String, dynamic> json = {};
    json['jobPostings'] = jobPostings.map((e) => e.toJson()).toList();
    return json;
  }

  const ListJobPostingsData({
    required this.jobPostings,
  });
}

