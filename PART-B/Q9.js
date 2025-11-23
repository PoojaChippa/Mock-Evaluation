function displayCar() {
  console.log("Selected Vehicle: Car");
}

function displayTruck() {
  console.log("Selected Vehicle: Truck");
}

function displayBike() {
  console.log("Selected Vehicle: Bike");
}

function vehicleInfo(vehicleCategory, callbackFn) {
  console.log("Vehicle Category:", vehicleCategory);
  callbackFn();
}

vehicleInfo("Car", displayCar);
vehicleInfo("Truck", displayTruck);
vehicleInfo("Bike", displayBike);
