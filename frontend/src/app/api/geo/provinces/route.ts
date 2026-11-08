import { NextResponse } from "next/server";
import { getAllProvinces } from "@/data/vietnam-schools";

export async function GET() {
  const provinces = getAllProvinces();
  return NextResponse.json({
    success: true,
    total: provinces.length,
    data: provinces,
  });
}
