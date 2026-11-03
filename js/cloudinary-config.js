// =========================================================
// Cloudinary configuration for New Ashok Jewellers
// Used to upload jewellery photos straight from the browser
// (unsigned upload — no secret key needed in the frontend).
// =========================================================

export const CLOUDINARY = {
    cloudName: "n017pnz5",          // your Cloudinary cloud name
    uploadPreset: "ashok_unsigned", // the unsigned preset we created
    // Base URL used to send the upload request
    uploadUrl: "https://api.cloudinary.com/v1_1/n017pnz5/image/upload"
};
