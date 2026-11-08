import { NextRequest, NextResponse } from "next/server";
import { searchSchools, getSchoolsByProvince, getAllUniversities } from "@/data/vietnam-schools";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || searchParams.get("query") || "";
  const province = searchParams.get("province");
  const type = searchParams.get("type");

  if (type === "university") {
    const unis = getAllUniversities();
    return NextResponse.json({
      success: true,
      total: unis.length,
      data: unis,
    });
  }

  if (province) {
    const schools = getSchoolsByProvince(province);
    return NextResponse.json({
      success: true,
      province,
      total: schools.length,
      data: schools,
    });
  }

  const results = searchSchools(q, 20);
  return NextResponse.json({
    success: true,
    query: q,
    total: results.length,
    data: results,
  });
}
