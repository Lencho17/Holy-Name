const { calculateStudentFee } = require('./backend/utils/feeCalculator');
async function test() {
  const result = await calculateStudentFee('328680ef-de9c-419b-b320-bf70d6497c8d', 2, false);
  console.log(result);
}
test();
