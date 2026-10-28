/**
 * js/paymentApi.js - Mobile Money / Card Payment Gateway Simulator
 * protoPork - ABCstartups / KachiCodes
 */

const PaymentAPI = {
  simulatePushPrompt(nsp, billingNumber, amountNgwee) {
    return new Promise((resolve, reject) => {
      if (!billingNumber || billingNumber.trim().length < 7) {
        reject(new Err("Enter a valid Mobile Money / Card number to proceed."));
        return;
      }
      resolve({
        status: "prompt_sent",
        nsp: nsp,
        number: billingNumber,
        amount: amountNgwee
      });
    });
  }
};