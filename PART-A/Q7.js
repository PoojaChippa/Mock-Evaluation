let emp = {
  name: "Prakash",
  details: {
    department: "IT",
    profile: { role: "Developer" },
  },
};

let role = emp.details?.profile?.role;
console.log(role);
