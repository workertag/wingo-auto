/**
 * India Post Pincode Lookup Utility
 * Uses the free India Post API to fetch location details from a pincode
 */

export interface PostOffice {
  Name: string;
  Description: string | null;
  BranchType: string;
  DeliveryStatus: string;
  Circle: string;
  District: string;
  Division: string;
  Region: string;
  Block: string;
  State: string;
  Country: string;
  Pincode: string;
}

interface PincodeResponse {
  Message: string;
  Status: "Success" | "Error" | "404";
  PostOffice: PostOffice[] | null;
}

export interface PincodeLookupResult {
  state: string;
  district: string;
  postOffices: PostOffice[];
}

import { api } from "@lib";

/**
 * Fetch location details from India Post API using pincode
 * @param pincode - 6 digit Indian pincode
 * @returns Location details or throws error
 */
export async function lookupPincode(
  pincode: string,
): Promise<PincodeLookupResult> {
  if (!/^\d{6}$/.test(pincode)) {
    throw new Error("Invalid pincode format. Must be 6 digits.");
  }

  let data: PincodeResponse[] | null = null;
  try {
    const res = await api.users.pincode({ pincode }).get();
    if (res?.data?.success && res?.data?.data) {
      data = res.data.data;
    } else {
      throw new Error("Proxy error");
    }
  } catch (_error) {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch pincode data");
    }

    data = (await response.json()) as PincodeResponse[];
  }

  if (!data || data.length === 0) {
    throw new Error("No data received from API");
  }

  const result = data[0];

  if (!result || result.Status !== "Success" || !result.PostOffice) {
    throw new Error("Pincode not found");
  }

  const postOffices = result.PostOffice;

  if (!postOffices[0]) {
    throw new Error("No post office data found");
  }

  return {
    state: postOffices[0].State,
    district: postOffices[0].District,
    postOffices,
  };
}
