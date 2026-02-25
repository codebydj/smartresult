const cheerio = require("cheerio");

function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function isSemesterHeading(txt) {
  if (!txt) return false;
  const t = txt.replace(/\s+/g, " ").trim();
  return (
    /(?:^|\s)(?:semester|sem)\b[\s:\-]*([ivx]+|\d+)/i.test(t) ||
    /\bsem\b\s*[-:]?\s*\d+/i.test(t)
  );
}

function parseTable($, table) {
  const rows = $(table).find("tr").toArray();
  let headerMap = null;
  const subjects = [];
  rows.forEach((r) => {
    const cells = $(r)
      .find("th,td")
      .toArray()
      .map((c) => clean($(c).text()));
    const low = cells.join(" ").toLowerCase();
    if (
      low.includes("subject") ||
      low.includes("code") ||
      low.includes("internal") ||
      low.includes("grade") ||
      low.includes("credit")
    ) {
      headerMap = {};
      cells.forEach((h, idx) => {
        const hh = h.toLowerCase();
        if (hh.includes("code")) headerMap.code = idx;
        else if (hh.includes("subject")) headerMap.name = idx;
        else if (
          hh.includes("grade point") ||
          hh.includes("gradepoint") ||
          hh === "gp"
        )
          headerMap.gradePoint = idx;
        else if (hh.includes("total")) headerMap.total = idx;
        else if (
          hh.includes("status") ||
          hh.includes("result") ||
          hh.includes("remarks")
        )
          headerMap.status = idx;
        else if (hh.includes("point")) headerMap.points = idx;
        else if (hh.includes("grade")) headerMap.grade = idx;
        else if (hh.includes("credit")) headerMap.credits = idx;
      });
      return;
    }
    if (!cells || cells.length < 2) return;
    if (headerMap) {
      const subj = {
        subjectCode: headerMap.code != null ? cells[headerMap.code] || "" : "",
        subjectName: headerMap.name != null ? cells[headerMap.name] || "" : "",
        gradePoint:
          headerMap.gradePoint != null
            ? cells[headerMap.gradePoint] || ""
            : headerMap.total != null
              ? cells[headerMap.total] || ""
              : "",
        grade: headerMap.grade != null ? cells[headerMap.grade] || "" : "",
        status: headerMap.status != null ? cells[headerMap.status] || "" : "",
        credit: headerMap.credits != null ? cells[headerMap.credits] || "" : "",
        points: headerMap.points != null ? cells[headerMap.points] || "" : "",
      };
      if (subj.subjectCode || subj.subjectName) subjects.push(subj);
    } else if (cells.length >= 6) {
      subjects.push({
        subjectCode: cells[0] || "",
        subjectName: cells[1] || "",
        gradePoint: cells[2] || "",
        grade: cells[3] || "",
        status: cells[4] || "",
        credit: cells[5] || "",
        points: cells[6] || "",
      });
    }
  });
  return subjects;
}

function parseHtml(html) {
  const $ = cheerio.load(html || "");
  const bodyText = clean($("body").text() || "");

  // extract basic details
  let studentName = "";
  let rollNumber = "";
  const text = $("body").text();
  const nameMatch = text.match(
    /(?:name|student name|student's name)\s*[:\-]?\s*(.+)/i,
  );
  if (nameMatch) studentName = clean(nameMatch[1].split(/\r?\n/)[0]);
  const rollMatch = text.match(
    /(?:hall\s*ticket|hallticket|roll\s*no(?:\.|umber)?|rno|register\s*no|reg\s*no)\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i,
  );
  if (rollMatch) rollNumber = clean(rollMatch[1]);

  // find semester headings and tables
  const allEls = $("body").find("*").toArray();
  const heads = [];
  allEls.forEach((el, idx) => {
    const txt = clean($(el).text());
    if (!txt) return;
    if (isSemesterHeading(txt)) {
      const m = txt.match(/(?:semester|sem)\s*[:\-]?\s*([ivx\d]+)/i);
      const semLabel = m ? m[1].toString().toUpperCase() : txt;
      heads.push({ idx, semLabel, el });
    }
  });

  const semesters = [];
  if (heads.length === 0) {
    // fallback: any table -> single semester
    const tables = $("table").toArray();
    const subjects = [];
    tables.forEach((t) => {
      parseTable($, t).forEach((s) => subjects.push(s));
    });
    const sgpa = (bodyText.match(/sgpa\s*[:\-]?\s*([\d.]+)/i) || [])[1] || "";
    const cgpa = (bodyText.match(/cgpa\s*[:\-]?\s*([\d.]+)/i) || [])[1] || "";
    semesters.push({ semester: "1", subjects, sgpa, cgpa });
  } else {
    for (let i = 0; i < heads.length; i++) {
      const startIdx = heads[i].idx;
      const endIdx = i + 1 < heads.length ? heads[i + 1].idx : allEls.length;
      // find tables between these indices
      const sectionEls = allEls.slice(startIdx, endIdx);
      const tables = sectionEls.filter(
        (e) => e.tagName && e.tagName.toLowerCase() === "table",
      );
      const subjects = [];
      tables.forEach((t) => {
        parseTable($, t).forEach((s) => subjects.push(s));
      });
      const sectionText = sectionEls.map((e) => clean($(e).text())).join(" ");
      const sgpa =
        (sectionText.match(/sgpa\s*[:\-]?\s*([\d.]+)/i) || [])[1] || "";
      const cgpa =
        (sectionText.match(/cgpa\s*[:\-]?\s*([\d.]+)/i) || [])[1] || "";
      semesters.push({ semester: heads[i].semLabel, subjects, sgpa, cgpa });
    }
  }

  return {
    studentName,
    rollNumber,
    semesters,
  };
}

module.exports = { parseHtml };
