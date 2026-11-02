/**
 * Catalog phòng thí nghiệm 3D (nguồn: PhET Colorado & Tongjiang Lab)
 *
 * Giấy phép & Bản quyền (CC BY-NC 4.0 Open Access):
 *   - Các mô phỏng 3D tương tác được kế thừa và phát triển từ PhET Interactive Simulations
 *     (Đại học Colorado Boulder, https://phet.colorado.edu) và Tongjiang Lab (© 2026 铜匠十点睡觉, https://lab.tongjiang.app).
 *   - Giấy phép: Creative Commons Ghi nhận công của tác giả – Phi thương mại 4.0 Quốc tế (CC BY-NC 4.0).
 *   - Toàn bộ 54 bài mô phỏng thí nghiệm 3D được mở MIỄN PHÍ 100% cho mọi Thầy Cô và Học sinh (không paywall, không thu phí bản quyền).
 *   - Gói PRO / MAX của EduTest AI chỉ thu phí các tính năng giá trị gia tăng độc quyền do EduTest AI phát triển:
 *     1. Trợ lý Sư phạm AI phân tích hiện tượng thí nghiệm.
 *     2. Kính vẽ Bục giảng tương tác (Transparent Whiteboard Overlay).
 *     3. Bộ công cụ tự động sinh Đề kiểm tra / Phiếu bài tập bám sát mô phỏng 3D.
 *
 * lang:
 *   - "metadata"  → toàn bộ nội dung bên trong bài học vẫn tiếng Trung (dùng minh họa trên máy chiếu)
 *   - "full"      → bài đã việt hóa tệp bài học (xem scripts/labs/translate.mjs)
 */

export type LabSubject = "phys" | "chem" | "bio" | "geo";

export interface LabLesson {
  slug: string;
  subject: LabSubject;
  titleVi: string;
  /** Câu hỏi dẫn dắt đã việt hóa (chỉ có ở bài pilot; undefined = chưa dịch) */
  questionVi?: string;
  /** Vị trí trong GDPT 2018 (chuỗi tự mô tả) */
  gdpt?: string;
  steps: number;
  lang: "full" | "full";
}

export const SUBJECT_LABEL: Record<LabSubject, string> = {
  phys: "Vật lý",
  chem: "Hóa học",
  bio: "Sinh học",
  geo: "Địa lý",
};

export const SUBJECT_COLOR: Record<LabSubject, string> = {
  phys: "bg-indigo-100 dark:bg-indigo-950/90 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80",
  chem: "bg-emerald-100 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80",
  bio: "bg-rose-100 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80",
  geo: "bg-amber-100 dark:bg-amber-950/90 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80",
};

export const PHET_CC_ATTRIBUTION = {
  license: "CC BY-NC 4.0",
  licenseName: "Creative Commons Attribution-NonCommercial 4.0 International",
  licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
  phetUrl: "https://phet.colorado.edu",
  phetName: "PhET Interactive Simulations (University of Colorado Boulder)",
  tongjiangUrl: "https://lab.tongjiang.app",
  tongjiangName: "Tongjiang Lab (© 2026 铜匠十点睡觉)",
  disclaimer:
    "Toàn bộ 54 mô phỏng thí nghiệm 3D được cung cấp 100% miễn phí cho mục đích giáo dục phi thương mại theo giấy phép CC BY-NC 4.0. EduTest AI chỉ thu phí các công cụ giá trị gia tăng sư phạm độc quyền.",
};

export const LABS: LabLesson[] = [

  // ============================== VẬT LÝ ==============================
  {
    slug: "photoelectric-step",
    subject: "phys",
    titleVi: "Hiệu ứng quang điện",
    questionVi: "Cùng một chùm sáng, vì sao đổi sang kim loại khác thì không bật ra được electron nào? Năng lượng của quang electron rốt cuộc do yếu tố nào của ánh sáng quyết định?",
    gdpt: "Lý 12 — Quang học / thuyết lượng tử: hiện tượng quang điện",
    steps: 9,
    lang: "full",
  },
  {
    slug: "capacitor-step",
    subject: "phys",
    titleVi: "Quan sát sự tích điện và phóng điện của tụ điện",
    questionVi: "Trong tụ điện thực sự chứa cái gì? Có thể chỉ dùng một con số để đo “sức chứa” của nó không?",
    gdpt: "Lý 11 — Điện trường: tụ điện, tần số điện dung C",
    steps: 9,
    lang: "full",
  },
  {
    slug: "accel-force-step",
    subject: "phys",
    titleVi: "Thí nghiệm: Tìm hiểu mối liên hệ giữa gia tốc với lực và khối lượng",
    questionVi: "Không đo trực tiếp lực, cũng không đo trực tiếp gia tốc – chỉ với một băng giấy và vài quả nặng móc, liệu có đo được mối liên hệ giữa a với F và m không?",
    gdpt: "Lý 10 — Lực và chuyển động: Định luật II Newton ( thí nghiệm bài 21/tương tự)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "energy-step",
    subject: "phys",
    titleVi: "Thí nghiệm: Kiểm chứng định luật bảo toàn cơ năng",
    questionVi: "Khi vật nặng rơi, thế năng trọng trường giảm đi có đúng bằng động năng tăng thêm không? Một băng giấy có đo được điều này không?",
    gdpt: "Lý 10 — Cơ năng: bảo toàn cơ năng (thí nghiệm)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "projectile-step",
    subject: "phys",
    titleVi: "Thí nghiệm: Tìm hiểu đặc điểm của chuyển động ném ngang",
    questionVi: "Chỉ với một máng nghiêng và một tấm chắn, liệu có thể tách chuyển động ném ngang thành hai chuyển động thành phần và đo được vận tốc ban đầu không?",
    gdpt: "Lý 10 — Chuyển động ném ngang (thí nghiệm)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "centripetal-step",
    subject: "phys",
    titleVi: "Tìm hiểu mối liên hệ giữa độ lớn lực hướng tâm với bán kính, tốc độ góc và khối lượng",
    questionVi: "Thiết bị quay tay này chỉ cho em số vạch trên hai thước chia vạch – liệu có dùng nó đo được mối liên hệ định lượng giữa F với m, r, ω không?",
    gdpt: "Lý 10 — Chuyển động tròn đều, lực hướng tâm (thí nghiệm)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "self-induction-step",
    subject: "phys",
    titleVi: "Tự cảm và dòng Foucault",
    questionVi: "Cuộn dây chỉ là quấn thêm mấy vòng dây đồng, vì sao hai bóng đèn sáng khác nhau? Công tắc đã ngắt rồi, dựa vào đâu bóng đèn còn sáng lên một chút?",
    gdpt: "Lý 11 — Điện từ cảm ứng: hiện tượng tự cảm, dòng điện xuôi (Foucault)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "emf-step",
    subject: "phys",
    titleVi: "Đo suất điện động và điện trở trong của nguồn điện",
    questionVi: "Suất điện động và điện trở trong của một pin khô cũ, làm sao “đo” ra bằng một vôn kế, một ampe kế và một biến trở con chạy? Đổi cách mắc khác, đo ra có còn như cũ không?",
    gdpt: "Lý 11 — Dòng điện không đổi: suất điện động E, điện trở trong r",
    steps: 9,
    lang: "full",
  },
  {
    slug: "current-field-step",
    subject: "phys",
    titleVi: "Từ trường của dòng điện",
    questionVi: "Từ trường không nhìn thấy, không sờ được, làm sao vẽ được nó, lại làm sao xác định chiều của nó?",
    gdpt: "Lý 11 — Từ trường: định luật Biô-Sa-vác, lực Loren (tiếp cận dòng điện thẳng)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "brownian-step",
    subject: "phys",
    titleVi: "Chuyển động Brown và sự khuếch tán",
    questionVi: "Phân tử thì không nhìn thấy, dựa vào đâu mà nói nó chuyển động hỗn loạn?",
    gdpt: "Lý 11 — Chuyển động nhiệt của các hạt cấu tạo nên chất (thuyết động chất khí)",
    steps: 9,
    lang: "full",
  },

  // ============================== HÓA HỌC ==============================
  {
    slug: "haber-step",
    subject: "chem",
    titleVi: "Tổng hợp ammonia",
    questionVi: "Làm thế nào biến nitrogen trong không khí thành ammonia vừa nhanh, vừa nhiều, vừa tiết kiệm?",
    gdpt: "Hóa 12 — Dung dịch, sự chuyển hóa tương tác hoá học giữa các chất: NH3",
    steps: 7,
    lang: "full",
  },
  {
    slug: "rate-step",
    subject: "chem",
    titleVi: "Các yếu tố ảnh hưởng đến tốc độ phản ứng hoá học",
    questionVi: "Cùng là hai phản ứng, vì sao có phản ứng vài giây đã xong, có phản ứng phải chờ rất lâu? Nhanh hay chậm rốt cuộc do đâu quyết định?",
    gdpt: "Hóa 11 — Tốc độ phản ứng hoá học (nồng độ, nhiệt độ, tác nhân xúc tác)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "ball-stick-step",
    subject: "chem",
    titleVi: "Lắp mô hình rỗng (quả cầu – que) tìm hiểu cấu trúc phân tử hợp chất hữu cơ",
    questionVi: "Phân tử vẽ trên giấy thì phẳng, hình dạng ba chiều thực sự của nó ra sao? Lắp một mô hình rỗng thì thấy được gì?",
    gdpt: "Hóa 11 — Hóa học hữu cơ: cấu trúc phân tử (CH4, C2H6, gigdan...)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "titration-step",
    subject: "chem",
    titleVi: "Chuẩn độ acid mạnh bằng base mạnh",
    questionVi: "Trước đó thêm hơn 20 mL gần như không thấy thay đổi, vì sao nửa giọt cuối cùng lại làm đổi màu hẳn?",
    gdpt: "Hóa 11 — Bazo – axit: chuẩn độ trung hòa (thí nghiệm)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "chlorine-step",
    subject: "chem",
    titleVi: "Điều chế và tính chất của chlorine",
    questionVi: "Muốn có một bình chlorine khô, tinh khiết, mỗi đoạn của bộ thí nghiệm đảm nhận việc gì? Thiếu một đoạn thì sao?",
    gdpt: "Hóa 10 — Kim loại kiềm – kiềm thổ / halogen: clo Cl2",
    steps: 9,
    lang: "full",
  },
  {
    slug: "blast-furnace-step",
    subject: "chem",
    titleVi: "Luyện gang lò cao",
    questionVi: "Một đống quặng đổ xuống từ đỉnh lò, sao vài giờ sau đã thành dòng gang lỏng, lại còn càng tiết kiệm càng tốt?",
    gdpt: "Hóa 10 — Sắt, đồng: luyện kim lò phản ứng (lò cao)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "smelting-step",
    subject: "chem",
    titleVi: "Luyện kim: điện phân muối nóng chảy + nhiệt nhôm",
    questionVi: "Vì sao nhôm chỉ có thể dùng điện để “tách” ra, còn sắt lại có thể bị nhôm “đẩy” ra?",
    gdpt: "Hóa 10 — Luyện kim: điện phân nóng chảy, nhiệt nhôm thermit",
    steps: 8,
    lang: "full",
  },
  {
    slug: "coal-gas-step",
    subject: "chem",
    titleVi: "Sử dụng tổng hợp than đá: lấy khí hoá than làm mạch chính",
    questionVi: "Than đá chỉ để đốt thôi sao? Làm thế nào biến than thành khí để sản xuất phân bón, methanol?",
    gdpt: "",
    steps: 8,
    lang: "full",
  },
  {
    slug: "sulfuric-step",
    subject: "chem",
    titleVi: "Điều chế H₂SO₄ (PP tiếp xúc)",
    questionVi: "Làm thế nào biến sulfur trong quặng thành sulfuric acid vừa nhanh, vừa nhiều, vừa tiết kiệm, vừa sạch?",
    gdpt: "Hóa 11 — Nhóm VA: lưu huỳnh, H2SO4 công nghiệp",
    steps: 7,
    lang: "full",
  },
  {
    slug: "hydrolysis-step",
    subject: "chem",
    titleVi: "Sự thuỷ phân của muối và ứng dụng",
    questionVi: "Các ion do muối phân li ra trông “chẳng acid cũng chẳng base”, dựa vào đâu mà làm dung dịch có tính acid hay base?",
    gdpt: "Hóa 11 — Điện ly: thủy phân muối",
    steps: 9,
    lang: "full",
  },
  {
    slug: "cement-step",
    subject: "chem",
    titleVi: "Sản xuất xi măng",
    questionVi: "Một xe đá và đất, dựa vào đâu mà nghiền một chút, nung một chút, rồi nghiền thêm là thành xi măng đủ sức xây đập?",
    gdpt: "",
    steps: 8,
    lang: "full",
  },
  {
    slug: "iron-step",
    subject: "chem",
    titleVi: "Sắt và hợp chất: chuyển hoá giữa các số oxi hoá của sắt",
    questionVi: "Cùng là nguyên tố sắt, vì sao trong ống nghiệm lúc là +2, lúc là +3, và dựa vào đâu ta biết nó là loại nào?",
    gdpt: "Hóa 10 — Sắt và một số hợp chất quan trọng của sắt",
    steps: 9,
    lang: "full",
  },
  {
    slug: "electrolysis-step",
    subject: "chem",
    titleVi: "Nguyên lý điện phân: điện phân dung dịch copper(II) chloride và dung dịch muối ăn bão hoà",
    questionVi: "Cùng một nguồn điện một chiều, vì sao điện phân dung dịch copper(II) chloride thu được copper và chlorine, còn điện phân dung dịch muối ăn bão hoà lại thu được hydrogen, chlorine và sodium hydroxide?",
    gdpt: "Hóa 11 — Điện phân (dung dịch CuCl2, NaCl bão hòa)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "ammonia-step",
    subject: "chem",
    titleVi: "Điều chế và tính chất của ammonia (gồm thí nghiệm “đài phun”)",
    questionVi: "Một bình khí ammonia, dựa vào đâu mà tự “hút” được nước trong cốc lên bình?",
    gdpt: "Hóa 11 — Nhóm VA: NH3 và muối amon",
    steps: 9,
    lang: "full",
  },
  {
    slug: "equilibrium-step",
    subject: "chem",
    titleVi: "Tìm hiểu các yếu tố ảnh hưởng đến chuyển dịch cân bằng hoá học",
    questionVi: "Thay đổi một điều kiện, dựa vào đâu mà nói cân bằng “chuyển dịch về phía nào”?",
    gdpt: "Hóa 11 — Vận tốc, cân bằng hoá học (Nguyên lý Le Chatelier)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "flame-step",
    subject: "chem",
    titleVi: "Thử màu ngọn lửa và quang phổ nguyên tử",
    questionVi: "Vì sao mỗi kim loại cho ngọn lửa một màu riêng, và dựa vào đâu mà chút màu ấy có thể coi là “phiếu kết quả phân tích”?",
    gdpt: "Hóa 10 — Kim loại kiềm (màu lửa Na, K); quang phổ (mở rộng kiến thức)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "galvanic-step",
    subject: "chem",
    titleVi: "Pin điện hoá: từ một dung dịch đến hai dung dịch",
    questionVi: "Trong một cốc sulfuric acid loãng đã có dòng điện rồi, vì sao còn phải đổi thành hai cốc và thêm một cầu muối?",
    gdpt: "Hóa 11/12 — Hóa năng → điện năng: pin Galvani",
    steps: 9,
    lang: "full",
  },
  {
    slug: "conductivity-step",
    subject: "chem",
    titleVi: "Sự điện li của chất điện li, tính dẫn điện của dung dịch và bản chất của phản ứng ion",
    questionVi: "Tay khô hay tay ướt cũng là cùng một bàn tay, sao tay ướt lại dễ bị điện giật hơn?",
    gdpt: "Hóa 11 — Sự điện li: chất điện li mạnh / yếu",
    steps: 9,
    lang: "full",
  },
  {
    slug: "nitric-lab-step",
    subject: "chem",
    titleVi: "Tính chất của nitric acid đặc, loãng và sự chuyển hoá các oxide của nitrogen",
    questionVi: "Cùng là đồng với nitric acid, vì sao một bình thoát khí màu nâu đỏ, bình kia lại không có màu gì?",
    gdpt: "Hóa 11 — Nhóm VA: Nitơ, HNO3",
    steps: 9,
    lang: "full",
  },
  {
    slug: "bromine-step",
    subject: "chem",
    titleVi: "Tách bromine từ nước biển: phương pháp thổi khí",
    questionVi: "Bromine trong nước biển chỉ có 65 mg/L, làm sao biến nó thành một bình bromine lỏng?",
    gdpt: "",
    steps: 7,
    lang: "full",
  },
  {
    slug: "sodium-step",
    subject: "chem",
    titleVi: "Tính chất của kim loại sodium (gồm cách dập cháy sodium)",
    questionVi: "Một mẩu kim loại nhỏ màu trắng bạc, vì sao phải ngâm trong dầu hoả, khi cháy đến nước cũng không được dội?",
    gdpt: "Hóa 10 — Kim loại kiềm: Na và hợp chất",
    steps: 9,
    lang: "full",
  },
  {
    slug: "sulfur-step",
    subject: "chem",
    titleVi: "Tính chất của sulfur, sulfur dioxide, sulfuric acid đặc và sự chuyển hoá giữa các chất chứa sulfur có số oxi hoá khác nhau",
    questionVi: "Cùng là sulfur, vì sao có lúc nó là chất rắn màu vàng, có lúc làm fuchsin mất màu, có lúc lại đi vào bột sắt?",
    gdpt: "Hóa 11 — Nhóm VA: Lưu huỳnh và oxit, acid",
    steps: 9,
    lang: "full",
  },
  {
    slug: "corrosion-step",
    subject: "chem",
    titleVi: "Ăn mòn hấp thụ oxygen và thiết kế miếng dán giữ nhiệt",
    questionVi: "Sắt gỉ chậm như vậy, dựa vào đâu mà làm được miếng dán giữ nhiệt trên 45 ℃? Và dựa vào đâu mà dùng ngược lại nó để bảo vệ sắt khỏi gỉ?",
    gdpt: "",
    steps: 9,
    lang: "full",
  },
  {
    slug: "chlor-alkali-step",
    subject: "chem",
    titleVi: "Công nghiệp chlor-kiềm",
    questionVi: "Cùng một lượng điện, làm sao thu được nhiều xút hơn, tốn ít điện hơn mà không xảy ra sự cố?",
    gdpt: "Hóa 11 — Điện phân dung dịch NaCl bão hòa có màng (theo thiết bị công nghiệp)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "hou-soda-step",
    subject: "chem",
    titleVi: "Phương pháp Hầu Đức Bảng",
    questionVi: "Làm thế nào dùng muối ăn và ammonia để sản xuất soda, lại thu thêm được phân đạm?",
    gdpt: "Hóa 10 — Kim loại kiềm: Na2CO3 (mở rộng)",
    steps: 8,
    lang: "full",
  },

  // ============================== SINH HỌC ==============================
  {
    slug: "plasmolysis-step",
    subject: "bio",
    titleVi: "Sự hút nước và mất nước của tế bào thực vật",
    questionVi: "Rau ngâm trong nước sạch sẽ cứng giòn, rắc muối thì rỉ nước – tế bào thực vật hút nước và mất nước như thế nào?",
    gdpt: "Sinh 10 — Chương transport (Quá trình trao đổi chất) chế độ chủ động/thụ động",
    steps: 8,
    lang: "full",
  },
  {
    slug: "transport-step",
    subject: "bio",
    titleVi: "Vận chuyển qua màng",
    questionVi: "Cùng một màng tế bào, vì sao oxygen tự đi qua được, glucose cần nhiều protein giúp, còn K⁺ lại đi vào được ngược chiều nồng độ?",
    gdpt: "Sinh 10 — Trao đổi chất và vật chất qua màng sinh chất",
    steps: 8,
    lang: "full",
  },
  {
    slug: "impulse-step",
    subject: "bio",
    titleVi: "Sự phát sinh và dẫn truyền xung thần kinh",
    questionVi: "Xuất phát trong vòng 0.1 s sau tiếng súng lệnh bị coi là xuất phát sớm (SGK tr. 27) – hưng phấn “chạy” trong cơ thể như thế nào?",
    gdpt: "Sinh 11 — Tiết và điều hòa nội môi (nội velit): hệ thần kinh",
    steps: 9,
    lang: "full",
  },
  {
    slug: "mitosis-step",
    subject: "bio",
    titleVi: "Quan sát nguyên phân ở tế bào mô phân sinh đầu rễ",
    questionVi: "Trên một đầu rễ hành, những tế bào nào đang phân chia? Mỗi kì của một lần phân chia kéo dài bao lâu?",
    gdpt: "Sinh 10 — Sự sinh sản và sinh trưởng phát triển: nguyên phân (thí nghiệm)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "enzyme-step",
    subject: "bio",
    titleVi: "Các điều kiện ảnh hưởng đến hoạt tính enzyme",
    questionVi: "Cùng một ống enzyme, vì sao cho vào nước sôi thì không cứu lại được nữa, còn cho vào nước đá lại có thể “tỉnh” lại?",
    gdpt: "Sinh 10 — Enzim (men) và chức năng dá nhiệm vị; nhiệt độ, độ pH",
    steps: 8,
    lang: "full",
  },

  // ============================== ĐỊA LÝ ==============================
  {
    slug: "river-step",
    subject: "geo",
    titleVi: "Sự phát triển của địa hình sông",
    questionVi: "Vì sao đường bờ đoạn Trấn Giang của sông Trường Giang liên tục dịch chuyển về phía bắc?",
    gdpt: "Địa 10 — Nước và môi trường: địa hình do nước chảy tạo",
    steps: 8,
    lang: "full",
  },
  {
    slug: "insolation-step",
    subject: "geo",
    titleVi: "Chuyển động biểu kiến của điểm Mặt Trời lên thiên đỉnh, bốn mùa và năm vành đai nhiệt",
    questionVi: "Góc nhập xạ lúc giữa trưa và hướng Mặt Trời lúc giữa trưa ở nơi trường em, vì sao trong một năm lại thay đổi có quy luật?",
    gdpt: "",
    steps: 9,
    lang: "full",
  },
  {
    slug: "currents-step",
    subject: "geo",
    titleVi: "Quy luật phân bố và ảnh hưởng của các dòng biển trên thế giới",
    questionVi: "Hàng vạn con vịt đồ chơi rơi xuống mặt biển, vì sao lại trôi dạt tới bờ biển khắp nơi trên thế giới?",
    gdpt: "Địa 10 — Vòng tuần hoàn nước trên thế giới (hải lưu)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "enso-step",
    subject: "geo",
    titleVi: "Tương tác biển – khí quyển và El Niño, La Niña",
    questionVi: "Ven biển Pê-ru quanh năm khô hạn, vì sao cuối năm 2016 nước biển vừa ấm lên đã mưa lớn, làm gần một trăm người thiệt mạng?",
    gdpt: "Địa 11/12 — Sự tương tác Khí quyển – thủy quyển, El Niño",
    steps: 7,
    lang: "full",
  },
  {
    slug: "heating-step",
    subject: "geo",
    titleVi: "Khí quyển nhận nhiệt",
    questionVi: "Mặt đất phơi nắng cả ngày, vì sao ban ngày nóng lên trước, ban đêm lại nguội nhanh đến thế – khí quyển rốt cuộc giữ lại cho mặt đất bao nhiêu nhiệt?",
    gdpt: "Địa 10 — Địa lí khí quyển: quá trình chiếu xạ, hiệu ứng nhà kính",
    steps: 9,
    lang: "full",
  },
  {
    slug: "karst-step",
    subject: "geo",
    titleVi: "Sự hình thành và nhận biết địa hình các-xtơ",
    questionVi: "Từ Hà Khách viết “núi dựng tách rời, xếp hàng đua nhọn” – những đỉnh nhọn như mọc lên từ lòng đất này được biến ra từ một lớp đá như thế nào?",
    gdpt: "Địa 10 — Địa hình cacxtơ (karst) — hiểu rõ tại Việt Nam (Phong Nha, Hàm Giang...)",
    steps: 7,
    lang: "full",
  },
  {
    slug: "carbon-step",
    subject: "geo",
    titleVi: "Biến đổi khí hậu toàn cầu và an ninh quốc gia",
    questionVi: "Vì sao Man-đi-vơ lại tổ chức họp nội các dưới đáy biển sâu 6 mét?",
    gdpt: "Địa 11/12 — Rừng, môi trường, biến đổi khí hậu",
    steps: 8,
    lang: "full",
  },
  {
    slug: "tectonic-step",
    subject: "geo",
    titleVi: "Sự hình thành địa hình kiến tạo",
    questionVi: "Vì sao trên cao nguyên Thanh Tạng lại tìm thấy hoá thạch lá cây lá rộng – sức mạnh nào đã nâng bề mặt lên, rồi lại cắt nó ra?",
    gdpt: "",
    steps: 6,
    lang: "full",
  },
  {
    slug: "earth-motion-step",
    subject: "geo",
    titleVi: "Hệ quả địa lý của các chuyển động của Trái Đất",
    questionVi: "Cùng một thời điểm, vì sao ở Bắc Kinh là giữa trưa, ở Niu Oóc là nửa đêm, và ban ngày mùa hạ lại dài hơn mùa đông?",
    gdpt: "Địa 10 — Trái Đất tự chuyển động quanh mặt trời (tự chuyển động chung quanh và ô-que)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "soil-step",
    subject: "geo",
    titleVi: "Các nhân tố hình thành đất và quan sát phẫu diện đất",
    questionVi: "Đất ở Đông Bắc vừa đen vừa màu mỡ, vì sao đất ở phía nam tương đối nghèo dinh dưỡng?",
    gdpt: "Địa 10 — Quá trình tạo ra đất, thành phần chủ yếu đất",
    steps: 8,
    lang: "full",
  },
  {
    slug: "thermal-step",
    subject: "geo",
    titleVi: "Hoàn lưu nhiệt",
    questionVi: "Hướng gió hai bên eo biển Đài Loan vì sao trong một ngày lại đảo ngược?",
    gdpt: "Địa 10 — Gió, luồng khí quyển địa phương (gió biển–đất, gió núi–thung lũng)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "wind-step",
    subject: "geo",
    titleVi: "Chuyển động ngang của không khí – gió",
    questionVi: "Gió trên bản đồ thời tiết vì sao không thổi thẳng từ áp cao sang áp thấp?",
    gdpt: "Địa 10 — Địa lí khí quyển: gió, sự chuyển động ngang",
    steps: 8,
    lang: "full",
  },
  {
    slug: "water-cycle-step",
    subject: "geo",
    titleVi: "Quá trình và ý nghĩa địa lý của vòng tuần hoàn nước",
    questionVi: "Sông ngòi không ngừng đổ ra biển, vì sao nước biển không tăng lên?",
    gdpt: "Địa 10 — Nước trên Trái Đất: chu trình nước",
    steps: 9,
    lang: "full",
  },
  {
    slug: "circulation-step",
    subject: "geo",
    titleVi: "Đai khí áp, đới gió và hoàn lưu ba vòng",
    questionVi: "Vì sao đoàn thuyền của Ma-gien-lăng có chặng gặp gió ngược, có chặng thuận gió, nhưng đến gần 30°S lại hầu như không nhích được bước nào?",
    gdpt: "Địa 10 — Địa lí khí quyển: phân bố khí áp và gió trên Trái Đất",
    steps: 7,
    lang: "full",
  },
];

export function getLab(slug: string): LabLesson | undefined {
  return LABS.find((l) => l.slug === slug);
}

export function labsBySubject(subject: LabSubject): LabLesson[] {
  return LABS.filter((l) => l.subject === subject);
}

/** 
 * Toàn bộ 54 bài đều mở 100% miễn phí cho người dùng (CC BY-NC 4.0)
 * Giữ FREE_TRIAL_LABS để tương thích ngược với các module tham chiếu cũ
 */
export const FREE_TRIAL_LABS: Record<LabSubject, string> = {
  phys: "photoelectric-step",
  chem: "haber-step",
  bio: "plasmolysis-step",
  geo: "river-step",
};

/**
 * Kiểm tra quyền truy cập mô phỏng: Tất cả 54 bài đều mở 100% miễn phí
 */
export function isLabFreeTrial(_slug: string): boolean {
  return true;
}

export function isOpenAccessLab(_slug: string): boolean {
  return true;
}

export function labFileUrl(slug: string): string {
  return `/labs/courses/${slug}.html`;
}

export function labCoverUrl(slug: string): string {
  return `/labs/covers/${slug}.webp`;
}
