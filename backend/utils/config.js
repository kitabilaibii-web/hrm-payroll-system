require("dotenv").config();
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || "hrm-dev-secret",
  OFFICE_START: process.env.OFFICE_START || "09:30",
  LEAVE_ALLOWANCE: { Casual: 10, Sick: 8 }, // days per year, Unpaid has no limit
  LATE_PER_DEDUCTION: 3, // every 3 late days = 1 day salary cut
};
