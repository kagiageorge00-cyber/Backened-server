# dataconnect_generated SDK

## Installation
```sh
flutter pub get firebase_data_connect
flutterfire configure
```
For more information, see [Flutter for Firebase installation documentation](https://firebase.google.com/docs/data-connect/flutter-sdk#use-core).

## Data Connect instance
Each connector creates a static class, with an instance of the `DataConnect` class that can be used to connect to your Data Connect backend and call operations.

### Connecting to the emulator

```dart
String host = 'localhost'; // or your host name
int port = 9399; // or your port number
ExampleConnector.instance.dataConnect.useDataConnectEmulator(host, port);
```

You can also call queries and mutations by using the connector class.
## Queries

### ListJobPostings
#### Required Arguments
```dart
// No required arguments
ExampleConnector.instance.listJobPostings().execute();
```



#### Return Type
`execute()` returns a `QueryResult<ListJobPostingsData, void>`
```dart
/// Result of an Operation Request (query/mutation).
class OperationResult<Data, Variables> {
  OperationResult(this.dataConnect, this.data, this.ref);
  Data data;
  OperationRef<Data, Variables> ref;
  FirebaseDataConnect dataConnect;
}

/// Result of a query request. Created to hold extra variables in the future.
class QueryResult<Data, Variables> extends OperationResult<Data, Variables> {
  QueryResult(super.dataConnect, super.data, super.ref);
}

final result = await ExampleConnector.instance.listJobPostings();
ListJobPostingsData data = result.data;
final ref = result.ref;
```

#### Getting the Ref
Each builder returns an `execute` function, which is a helper function that creates a `Ref` object, and executes the underlying operation.
An example of how to use the `Ref` object is shown below:
```dart
final ref = ExampleConnector.instance.listJobPostings().ref();
ref.execute();

ref.subscribe(...);
```


### GetUserByEmail
#### Required Arguments
```dart
String email = ...;
ExampleConnector.instance.getUserByEmail(
  email: email,
).execute();
```



#### Return Type
`execute()` returns a `QueryResult<GetUserByEmailData, GetUserByEmailVariables>`
```dart
/// Result of an Operation Request (query/mutation).
class OperationResult<Data, Variables> {
  OperationResult(this.dataConnect, this.data, this.ref);
  Data data;
  OperationRef<Data, Variables> ref;
  FirebaseDataConnect dataConnect;
}

/// Result of a query request. Created to hold extra variables in the future.
class QueryResult<Data, Variables> extends OperationResult<Data, Variables> {
  QueryResult(super.dataConnect, super.data, super.ref);
}

final result = await ExampleConnector.instance.getUserByEmail(
  email: email,
);
GetUserByEmailData data = result.data;
final ref = result.ref;
```

#### Getting the Ref
Each builder returns an `execute` function, which is a helper function that creates a `Ref` object, and executes the underlying operation.
An example of how to use the `Ref` object is shown below:
```dart
String email = ...;

final ref = ExampleConnector.instance.getUserByEmail(
  email: email,
).ref();
ref.execute();

ref.subscribe(...);
```

## Mutations

### CreateApplicant
#### Required Arguments
```dart
Timestamp applicationDate = ...;
String email = ...;
String firstName = ...;
String lastName = ...;
String resumeUrl = ...;
ExampleConnector.instance.createApplicant(
  applicationDate: applicationDate,
  email: email,
  firstName: firstName,
  lastName: lastName,
  resumeUrl: resumeUrl,
).execute();
```



#### Return Type
`execute()` returns a `OperationResult<CreateApplicantData, CreateApplicantVariables>`
```dart
/// Result of an Operation Request (query/mutation).
class OperationResult<Data, Variables> {
  OperationResult(this.dataConnect, this.data, this.ref);
  Data data;
  OperationRef<Data, Variables> ref;
  FirebaseDataConnect dataConnect;
}

final result = await ExampleConnector.instance.createApplicant(
  applicationDate: applicationDate,
  email: email,
  firstName: firstName,
  lastName: lastName,
  resumeUrl: resumeUrl,
);
CreateApplicantData data = result.data;
final ref = result.ref;
```

#### Getting the Ref
Each builder returns an `execute` function, which is a helper function that creates a `Ref` object, and executes the underlying operation.
An example of how to use the `Ref` object is shown below:
```dart
Timestamp applicationDate = ...;
String email = ...;
String firstName = ...;
String lastName = ...;
String resumeUrl = ...;

final ref = ExampleConnector.instance.createApplicant(
  applicationDate: applicationDate,
  email: email,
  firstName: firstName,
  lastName: lastName,
  resumeUrl: resumeUrl,
).ref();
ref.execute();
```


### UpdateApplicationStatus
#### Required Arguments
```dart
String id = ...;
String applicationStatus = ...;
ExampleConnector.instance.updateApplicationStatus(
  id: id,
  applicationStatus: applicationStatus,
).execute();
```



#### Return Type
`execute()` returns a `OperationResult<UpdateApplicationStatusData, UpdateApplicationStatusVariables>`
```dart
/// Result of an Operation Request (query/mutation).
class OperationResult<Data, Variables> {
  OperationResult(this.dataConnect, this.data, this.ref);
  Data data;
  OperationRef<Data, Variables> ref;
  FirebaseDataConnect dataConnect;
}

final result = await ExampleConnector.instance.updateApplicationStatus(
  id: id,
  applicationStatus: applicationStatus,
);
UpdateApplicationStatusData data = result.data;
final ref = result.ref;
```

#### Getting the Ref
Each builder returns an `execute` function, which is a helper function that creates a `Ref` object, and executes the underlying operation.
An example of how to use the `Ref` object is shown below:
```dart
String id = ...;
String applicationStatus = ...;

final ref = ExampleConnector.instance.updateApplicationStatus(
  id: id,
  applicationStatus: applicationStatus,
).ref();
ref.execute();
```

