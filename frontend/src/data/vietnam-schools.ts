/**
 * Bộ dữ liệu chuẩn hóa 63 Tỉnh/Thành phố & Danh mục Trường THPT / Đại học tiêu biểu tại Việt Nam
 * Phục vụ:
 * 1. Tiêu đề chuẩn hóa đề thi theo khung GDPT 2025 (Sở GD&ĐT ... - Trường THPT ...)
 * 2. Autocomplete chọn đơn vị công tác / trường học khi xác thực Thẻ ngành Giáo viên & Gia sư
 * 3. Chuẩn hóa đối soát dữ liệu OCR
 */

export interface SchoolItem {
  id: string;
  name: string;
  code?: string;
  type: "specialized" | "public" | "private" | "university";
  province: string;
  shortName?: string;
}

export interface ProvinceItem {
  code: string;
  name: string;
  shortName: string;
  region: "bac" | "trung" | "nam";
}

export const VIETNAM_PROVINCES: ProvinceItem[] = [
  { code: "01", name: "Hà Nội", shortName: "HN", region: "bac" },
  { code: "79", name: "Thành phố Hồ Chí Minh", shortName: "TP.HCM", region: "nam" },
  { code: "48", name: "Đà Nẵng", shortName: "ĐNA", region: "trung" },
  { code: "31", name: "Hải Phòng", shortName: "HP", region: "bac" },
  { code: "92", name: "Cần Thơ", shortName: "CT", region: "nam" },
  { code: "26", name: "Vĩnh Phúc", shortName: "VP", region: "bac" },
  { code: "27", name: "Bắc Ninh", shortName: "BN", region: "bac" },
  { code: "30", name: "Hải Dương", shortName: "HD", region: "bac" },
  { code: "33", name: "Hưng Yên", shortName: "HY", region: "bac" },
  { code: "34", name: "Thái Bình", shortName: "TB", region: "bac" },
  { code: "35", name: "Hà Nam", shortName: "HNA", region: "bac" },
  { code: "36", name: "Nam Định", shortName: "NĐ", region: "bac" },
  { code: "37", name: "Ninh Bình", shortName: "NB", region: "bac" },
  { code: "38", name: "Thanh Hóa", shortName: "TH", region: "trung" },
  { code: "40", name: "Nghệ An", shortName: "NA", region: "trung" },
  { code: "42", name: "Hà Tĩnh", shortName: "HT", region: "trung" },
  { code: "44", name: "Quảng Bình", shortName: "QB", region: "trung" },
  { code: "45", name: "Quảng Trị", shortName: "QT", region: "trung" },
  { code: "46", name: "Thừa Thiên Huế", shortName: "TTH", region: "trung" },
  { code: "49", name: "Quảng Nam", shortName: "QNA", region: "trung" },
  { code: "51", name: "Quảng Ngãi", shortName: "QNG", region: "trung" },
  { code: "52", name: "Bình Định", shortName: "BĐ", region: "trung" },
  { code: "54", name: "Phú Yên", shortName: "PY", region: "trung" },
  { code: "56", name: "Khánh Hòa", shortName: "KH", region: "trung" },
  { code: "58", name: "Ninh Thuận", shortName: "NT", region: "trung" },
  { code: "60", name: "Bình Thuận", shortName: "BT", region: "trung" },
  { code: "62", name: "Kon Tum", shortName: "KT", region: "trung" },
  { code: "64", name: "Gia Lai", shortName: "GL", region: "trung" },
  { code: "66", name: "Đắk Lắk", shortName: "ĐL", region: "trung" },
  { code: "67", name: "Đắk Nông", shortName: "ĐN", region: "trung" },
  { code: "68", name: "Lâm Đồng", shortName: "LĐ", region: "trung" },
  { code: "70", name: "Bình Phước", shortName: "BP", region: "nam" },
  { code: "72", name: "Tây Ninh", shortName: "TN", region: "nam" },
  { code: "74", name: "Bình Dương", shortName: "BD", region: "nam" },
  { code: "75", name: "Đồng Nai", shortName: "ĐNA", region: "nam" },
  { code: "77", name: "Bà Rịa - Vũng Tàu", shortName: "BRVT", region: "nam" },
  { code: "80", name: "Long An", shortName: "LA", region: "nam" },
  { code: "82", name: "Tiền Giang", shortName: "TG", region: "nam" },
  { code: "83", name: "Bến Tre", shortName: "BTRE", region: "nam" },
  { code: "84", name: "Trà Vinh", shortName: "TV", region: "nam" },
  { code: "86", name: "Vĩnh Long", shortName: "VL", region: "nam" },
  { code: "87", name: "Đồng Tháp", shortName: "ĐT", region: "nam" },
  { code: "89", name: "An Giang", shortName: "AG", region: "nam" },
  { code: "91", name: "Kiên Giang", shortName: "KG", region: "nam" },
  { code: "93", name: "Hậu Giang", shortName: "HG", region: "nam" },
  { code: "94", name: "Sóc Trăng", shortName: "ST", region: "nam" },
  { code: "95", name: "Bạc Liêu", shortName: "BL", region: "nam" },
  { code: "96", name: "Cà Mau", shortName: "CM", region: "nam" },
  { code: "02", name: "Hà Giang", shortName: "HG", region: "bac" },
  { code: "04", name: "Cao Bằng", shortName: "CB", region: "bac" },
  { code: "06", name: "Bắc Kạn", shortName: "BK", region: "bac" },
  { code: "08", name: "Tuyên Quang", shortName: "TQ", region: "bac" },
  { code: "10", name: "Lào Cai", shortName: "LC", region: "bac" },
  { code: "11", name: "Điện Biên", shortName: "ĐB", region: "bac" },
  { code: "12", name: "Lai Châu", shortName: "LC", region: "bac" },
  { code: "14", name: "Sơn La", shortName: "SL", region: "bac" },
  { code: "15", name: "Yên Bái", shortName: "YB", region: "bac" },
  { code: "17", name: "Hòa Bình", shortName: "HB", region: "bac" },
  { code: "19", name: "Thái Nguyên", shortName: "TN", region: "bac" },
  { code: "20", name: "Lạng Sơn", shortName: "LS", region: "bac" },
  { code: "22", name: "Quảng Ninh", shortName: "QN", region: "bac" },
  { code: "24", name: "Bắc Giang", shortName: "BG", region: "bac" },
  { code: "25", name: "Phú Thọ", shortName: "PT", region: "bac" },
];

export const POPULAR_SCHOOLS: SchoolItem[] = [
  // Hà Nội
  { id: "hn_ams", name: "THPT Chuyên Hà Nội - Amsterdam", province: "Hà Nội", type: "specialized", shortName: "Ams" },
  { id: "hn_ckh", name: "THPT Chuyên Khoa học Tự nhiên", province: "Hà Nội", type: "specialized", shortName: "Chuyên KHTN" },
  { id: "hn_csp", name: "THPT Chuyên Đại học Sư phạm", province: "Hà Nội", type: "specialized", shortName: "Chuyên Sư Phạm" },
  { id: "hn_cfl", name: "THPT Chuyên Ngoại ngữ", province: "Hà Nội", type: "specialized", shortName: "CNN" },
  { id: "hn_cxh", name: "THPT Chuyên Khoa học Xã hội và Nhân văn", province: "Hà Nội", type: "specialized", shortName: "Chuyên KHXH&NV" },
  { id: "hn_cvd", name: "THPT Chu Văn An", province: "Hà Nội", type: "public", shortName: "Chu Văn An" },
  { id: "hn_kdt", name: "THPT Kim Liên", province: "Hà Nội", type: "public", shortName: "Kim Liên" },
  { id: "hn_vdt", name: "THPT Việt Đức", province: "Hà Nội", type: "public", shortName: "Việt Đức" },
  { id: "hn_tba", name: "THPT Thăng Long", province: "Hà Nội", type: "public", shortName: "Thăng Long" },
  { id: "hn_pdp", name: "THPT Phan Đình Phùng", province: "Hà Nội", type: "public", shortName: "Phan Đình Phùng" },
  { id: "hn_yho", name: "THPT Yên Hòa", province: "Hà Nội", type: "public", shortName: "Yên Hòa" },
  { id: "hn_cda", name: "THPT Cầu Giấy", province: "Hà Nội", type: "public", shortName: "Cầu Giấy" },
  { id: "hn_ltd", name: "THPT Lương Thế Vinh", province: "Hà Nội", type: "private", shortName: "Lương Thế Vinh" },
  { id: "hn_nhu", name: "THPT Chuyên Nguyễn Huệ", province: "Hà Nội", type: "specialized", shortName: "Nguyễn Huệ" },
  { id: "hn_sdg", name: "THPT Chuyên Sơn Tây", province: "Hà Nội", type: "specialized", shortName: "Sơn Tây" },

  // TP. Hồ Chí Minh
  { id: "hcm_lpt", name: "THPT Chuyên Lê Hồng Phong", province: "Thành phố Hồ Chí Minh", type: "specialized", shortName: "Lê Hồng Phong" },
  { id: "hcm_tdn", name: "THPT Chuyên Trần Đại Nghĩa", province: "Thành phố Hồ Chí Minh", type: "specialized", shortName: "Trần Đại Nghĩa" },
  { id: "hcm_ptnk", name: "Phổ thông Năng khiếu (ĐHQG TP.HCM)", province: "Thành phố Hồ Chí Minh", type: "specialized", shortName: "PTNK" },
  { id: "hcm_ndc", name: "THPT Nguyễn Thượng Hiền", province: "Thành phố Hồ Chí Minh", type: "public", shortName: "Nguyễn Thượng Hiền" },
  { id: "hcm_gds", name: "THPT Gia Định", province: "Thành phố Hồ Chí Minh", type: "public", shortName: "Gia Định" },
  { id: "hcm_btr", name: "THPT Bùi Thị Xuân", province: "Thành phố Hồ Chí Minh", type: "public", shortName: "Bùi Thị Xuân" },
  { id: "hcm_lqd", name: "THPT Lê Quý Đôn", province: "Thành phố Hồ Chí Minh", type: "public", shortName: "Lê Quý Đôn" },
  { id: "hcm_mkh", name: "THPT Nguyễn Thị Minh Khai", province: "Thành phố Hồ Chí Minh", type: "public", shortName: "Minh Khai" },
  { id: "hcm_pth", name: "THPT Mạc Đĩnh Chi", province: "Thành phố Hồ Chí Minh", type: "public", shortName: "Mạc Đĩnh Chi" },

  // Đà Nẵng
  { id: "dna_lqd", name: "THPT Chuyên Lê Quý Đôn", province: "Đà Nẵng", type: "specialized", shortName: "Lê Quý Đôn ĐN" },
  { id: "dna_ptc", name: "THPT Phan Châu Trinh", province: "Đà Nẵng", type: "public", shortName: "Phan Châu Trinh" },
  { id: "dna_hpb", name: "THPT Hoàng Hoa Thám", province: "Đà Nẵng", type: "public", shortName: "Hoàng Hoa Thám" },

  // Hải Phòng
  { id: "hp_trphu", name: "THPT Chuyên Trần Phú", province: "Hải Phòng", type: "specialized", shortName: "Trần Phú HP" },
  { id: "hp_ngo", name: "THPT Ngô Quyền", province: "Hải Phòng", type: "public", shortName: "Ngô Quyền" },

  // Nam Định
  { id: "nd_lhd", name: "THPT Chuyên Lê Hồng Phong", province: "Nam Định", type: "specialized", shortName: "Lê Hồng Phong NĐ" },
  { id: "nd_tnh", name: "THPT Giao Thủy", province: "Nam Định", type: "public", shortName: "Giao Thủy" },

  // Nghệ An
  { id: "na_ptb", name: "THPT Chuyên Phan Bội Châu", province: "Nghệ An", type: "specialized", shortName: "Phan Bội Châu" },
  { id: "na_vinh", name: "THPT Chuyên Đại học Vinh", province: "Nghệ An", type: "specialized", shortName: "Chuyên ĐH Vinh" },
  { id: "na_htc", name: "THPT Huỳnh Thúc Kháng", province: "Nghệ An", type: "public", shortName: "Huỳnh Thúc Kháng" },

  // Thanh Hóa
  { id: "th_lamson", name: "THPT Chuyên Lam Sơn", province: "Thanh Hóa", type: "specialized", shortName: "Lam Sơn" },
  { id: "th_dao", name: "THPT Đào Duy Từ", province: "Thanh Hóa", type: "public", shortName: "Đào Duy Từ" },

  // Thừa Thiên Huế
  { id: "tth_qhoc", name: "THPT Chuyên Quốc Học Huế", province: "Thừa Thiên Huế", type: "specialized", shortName: "Quốc Học Huế" },
  { id: "tth_hbt", name: "THPT Hai Bà Trưng", province: "Thừa Thiên Huế", type: "public", shortName: "Hai Bà Trưng" },

  // Vĩnh Phúc
  { id: "vp_chuyen", name: "THPT Chuyên Vĩnh Phúc", province: "Vĩnh Phúc", type: "specialized", shortName: "Chuyên Vĩnh Phúc" },

  // Bắc Ninh
  { id: "bn_chuyen", name: "THPT Chuyên Bắc Ninh", province: "Bắc Ninh", type: "specialized", shortName: "Chuyên Bắc Ninh" },

  // Cần Thơ
  { id: "ct_lytutrong", name: "THPT Chuyên Lý Tự Trọng", province: "Cần Thơ", type: "specialized", shortName: "Lý Tự Trọng" },
  { id: "ct_chauvantiem", name: "THPT Châu Văn Liêm", province: "Cần Thơ", type: "public", shortName: "Châu Văn Liêm" },
];

export const TOP_UNIVERSITIES: SchoolItem[] = [
  // Đại học Sư phạm & Giáo dục
  { id: "uni_hnue", name: "Trường Đại học Sư phạm Hà Nội", province: "Hà Nội", type: "university", shortName: "HNUE" },
  { id: "uni_hcmue", name: "Trường Đại học Sư phạm TP.HCM", province: "Thành phố Hồ Chí Minh", type: "university", shortName: "HCMUE" },
  { id: "uni_uel_vnu", name: "Trường Đại học Giáo dục - ĐHQG Hà Nội", province: "Hà Nội", type: "university", shortName: "UEd - VNU" },
  
  // ĐHQG & Đại học Bách khoa
  { id: "uni_hust", name: "Đại học Bách khoa Hà Nội", province: "Hà Nội", type: "university", shortName: "HUST" },
  { id: "uni_uet_vnu", name: "Trường Đại học Công nghệ - ĐHQG Hà Nội", province: "Hà Nội", type: "university", shortName: "UET - VNU" },
  { id: "uni_hus_vnu", name: "Trường Đại học Khoa học Tự nhiên - ĐHQG Hà Nội", province: "Hà Nội", type: "university", shortName: "HUS - VNU" },
  { id: "uni_bk_vnuhcm", name: "Trường Đại học Bách khoa - ĐHQG TP.HCM", province: "Thành phố Hồ Chí Minh", type: "university", shortName: "HCMUT" },
  { id: "uni_khtn_vnuhcm", name: "Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM", province: "Thành phố Hồ Chí Minh", type: "university", shortName: "HCMUS" },
  { id: "uni_uit_vnuhcm", name: "Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM", province: "Thành phố Hồ Chí Minh", type: "university", shortName: "UIT" },

  // Khối Kinh tế, Ngoại thương, Y Dược
  { id: "uni_neu", name: "Đại học Kinh tế Quốc dân", province: "Hà Nội", type: "university", shortName: "NEU" },
  { id: "uni_ftu", name: "Trường Đại học Ngoại thương", province: "Hà Nội", type: "university", shortName: "FTU" },
  { id: "uni_ueh", name: "Đại học Kinh tế TP. Hồ Chí Minh", province: "Thành phố Hồ Chí Minh", type: "university", shortName: "UEH" },
  { id: "uni_hmu", name: "Trường Đại học Y Hà Nội", province: "Hà Nội", type: "university", shortName: "HMU" },
  { id: "uni_ump", name: "Đại học Y Dược TP. Hồ Chí Minh", province: "Thành phố Hồ Chí Minh", type: "university", shortName: "UMP" },
  { id: "uni_dav", name: "Học viện Ngoại giao", province: "Hà Nội", type: "university", shortName: "DAV" },
  { id: "uni_ajc", name: "Học viện Báo chí và Tuyên truyền", province: "Hà Nội", type: "university", shortName: "AJC" },
];

/**
 * Trả về danh sách tỉnh thành
 */
export function getAllProvinces(): ProvinceItem[] {
  return VIETNAM_PROVINCES;
}

/**
 * Tìm trường THPT theo tỉnh thành
 */
export function getSchoolsByProvince(provinceName: string): SchoolItem[] {
  const norm = provinceName.toLowerCase().trim();
  return POPULAR_SCHOOLS.filter(
    (s) => s.province.toLowerCase().includes(norm) || norm.includes(s.province.toLowerCase())
  );
}

/**
 * Tìm kiếm trường học hoặc đại học theo từ khóa (hỗ trợ autocomplete)
 */
export function searchSchools(keyword: string, limit = 15): SchoolItem[] {
  if (!keyword || keyword.trim().length === 0) {
    return [...POPULAR_SCHOOLS.slice(0, 10), ...TOP_UNIVERSITIES.slice(0, 5)];
  }
  const clean = keyword.toLowerCase().trim();
  const all = [...POPULAR_SCHOOLS, ...TOP_UNIVERSITIES];
  return all
    .filter(
      (item) =>
        item.name.toLowerCase().includes(clean) ||
        (item.shortName && item.shortName.toLowerCase().includes(clean)) ||
        item.province.toLowerCase().includes(clean)
    )
    .slice(0, limit);
}

/**
 * Danh sách đại học phục vụ xác thực thẻ gia sư
 */
export function getAllUniversities(): SchoolItem[] {
  return TOP_UNIVERSITIES;
}
