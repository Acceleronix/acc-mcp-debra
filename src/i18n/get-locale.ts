"use server";


export async function getLocaleAction() {
  // Force English as default language
  return "en";
}
