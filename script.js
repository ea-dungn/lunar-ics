import { computeDateFromLunarDate } from "./amlich.js";

const lunarDayInput = document.getElementById("lunarDay");
const lunarMonthInput = document.getElementById("lunarMonth");
const eventTitleInput = document.getElementById("eventTitle");
const repeatYearsInput = document.getElementById("repeatYears");
const previewBtn = document.getElementById("previewBtn");
const generateBtn = document.getElementById("generateBtn");
const previewArea = document.getElementById("previewArea");

function formatDate(year, month, day) {
  const y = String(year);
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}${m}${d}`;
}

function formatDisplayDate(solarDate) {
  return `${String(solarDate.dd).padStart(2, "0")}/${String(solarDate.mm).padStart(2, "0")}/${solarDate.yy}`;
}

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function calculateSolarDates(lunarDay, lunarMonth, startYear, numYears) {
  const dates = [];
  let currentSolarYear = startYear;

  for (let i = 0; i < numYears; i++) {
    let solarDate = null;
    let attemptYear = currentSolarYear + i;

    try {
      let isLeap = false; // Hoặc 0
      // Gọi hàm đã import
      let solarResult = computeDateFromLunarDate(
        lunarDay,
        lunarMonth,
        attemptYear,
        isLeap,
        7,
      );

      if (
        solarResult &&
        solarResult.day &&
        solarResult.month !== undefined &&
        solarResult.year
      ) {
        // Kiểm tra month !== undefined vì có thể là 0
        let solarDate = {
          dd: solarResult.day,
          mm: solarResult.month + 1, // Tháng trả về từ 0-11, cần +1
          yy: solarResult.year,
        };
        dates.push({
          lunar: { day: lunarDay, month: lunarMonth, year: attemptYear },
          solar: solarDate,
        });
      } else {
        console.warn(
          `Không tìm thấy ngày dương lịch cho <span class="math-inline">\{lunarDay\}/</span>{lunarMonth} Âm lịch năm ${attemptYear}.`,
        );
      }
    } catch (error) {
      console.error(
        `Lỗi khi chuyển đổi ngày <span class="math-inline">\{lunarDay\}/</span>{lunarMonth} Âm lịch năm ${attemptYear}:`,
        error,
      );
      alert(
        "Đã xảy ra lỗi khi gọi thư viện chuyển đổi lịch. Vui lòng kiểm tra console.",
      );
      return [];
    }
  }
  return dates;
}

function displayPreview(calculatedDates, title) {
  if (!calculatedDates || calculatedDates.length === 0) {
    previewArea.textContent =
      "Không có ngày nào để hiển thị. Vui lòng kiểm tra lại thông tin nhập hoặc kết quả từ amlich.js.";
    return;
  }

  let previewText = `Xem trước cho sự kiện: "${title}"\n`;
  previewText += "------------------------------------------\n";
  previewText += "Ngày Âm Lịch  =>  Ngày Dương Lịch (Năm DL)\n";
  previewText += "------------------------------------------\n";

  calculatedDates.forEach((item) => {
    const lunarStr = `${String(item.lunar.day).padStart(2, "0")}/${String(item.lunar.month).padStart(2, "0")}`;
    const solarStr = formatDisplayDate(item.solar);
    previewText += `${lunarStr}        =>  ${solarStr} (${item.solar.yy})\n`;
  });

  previewArea.textContent = previewText;
}

function generateICSContent(calculatedDates, title) {
  if (!calculatedDates || calculatedDates.length === 0) {
    alert("Không có ngày nào hợp lệ để tạo file ICS.");
    return null;
  }

  let icsString = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

  const timestamp = getTimestamp();

  calculatedDates.forEach((item) => {
    const solarDateFormatted = formatDate(
      item.solar.yy,
      item.solar.mm,
      item.solar.dd,
    );

    icsString += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART;VALUE=DATE:${solarDateFormatted}
SUMMARY:${title} (${item.lunar.day}/${item.lunar.month} ÂL)
DESCRIPTION:Sự kiện ${title} vào ngày ${item.lunar.day}/${item.lunar.month} Âm lịch.
TRANSP:TRANSPARENT
SEQUENCE:0
STATUS:CONFIRMED
END:VEVENT
`;
  });

  icsString += "END:VCALENDAR";
  return icsString;
}

function downloadICS(filename, content) {
  if (!content) return;

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

previewBtn.addEventListener("click", () => {
  const lunarDay = parseInt(lunarDayInput.value, 10);
  const lunarMonth = parseInt(lunarMonthInput.value, 10);
  const eventTitle = eventTitleInput.value.trim();
  const repeatYears = parseInt(repeatYearsInput.value, 10);
  const currentYear = new Date().getFullYear();

  if (
    !lunarDay ||
    !lunarMonth ||
    !eventTitle ||
    !repeatYears ||
    lunarDay < 1 ||
    lunarDay > 30 ||
    lunarMonth < 1 ||
    lunarMonth > 12 ||
    repeatYears < 1
  ) {
    alert("Vui lòng nhập đầy đủ và chính xác thông tin!");
    previewArea.textContent = "Vui lòng nhập đầy đủ và chính xác thông tin.";
    return;
  }
  if (typeof computeDateFromLunarDate !== "function") {
    alert(
      "Lỗi: Không tìm thấy hàm computeDateFromLunarDate từ amlich.js. Vui lòng kiểm tra lại.",
    );
    previewArea.textContent =
      "Lỗi: Thiếu thư viện amlich.js hoặc hàm không đúng.";
    return;
  }

  const calculatedDates = calculateSolarDates(
    lunarDay,
    lunarMonth,
    currentYear,
    repeatYears,
  );
  displayPreview(calculatedDates, eventTitle);
});

generateBtn.addEventListener("click", () => {
  const lunarDay = parseInt(lunarDayInput.value, 10);
  const lunarMonth = parseInt(lunarMonthInput.value, 10);
  const eventTitle = eventTitleInput.value.trim();
  const repeatYears = parseInt(repeatYearsInput.value, 10);
  const currentYear = new Date().getFullYear();

  if (
    !lunarDay ||
    !lunarMonth ||
    !eventTitle ||
    !repeatYears ||
    lunarDay < 1 ||
    lunarDay > 30 ||
    lunarMonth < 1 ||
    lunarMonth > 12 ||
    repeatYears < 1
  ) {
    alert("Vui lòng nhập đầy đủ và chính xác thông tin!");
    return;
  }
  if (typeof computeDateFromLunarDate !== "function") {
    alert(
      "Lỗi: Không tìm thấy hàm computeDateFromLunarDate từ amlich.js. Vui lòng kiểm tra lại.",
    );
    return;
  }

  const calculatedDates = calculateSolarDates(
    lunarDay,
    lunarMonth,
    currentYear,
    repeatYears,
  );
  const icsContent = generateICSContent(calculatedDates, eventTitle);

  if (icsContent) {
    const filename = `lich_am_${lunarDay}_${lunarMonth}_${repeatYears}_nam.ics`;
    downloadICS(filename, icsContent);
  }
});

window.onload = () => {
  if (
    lunarDayInput.value &&
    lunarMonthInput.value &&
    eventTitleInput.value &&
    repeatYearsInput.value
  ) {
    previewBtn.click();
  }
};
