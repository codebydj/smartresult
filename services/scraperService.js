const puppeteer = require("puppeteer");

async function getResult(pin) {
  let browser;
  try {
    const launchOptions = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1920,1080",
      ],
    };

    browser = await Promise.race([
      puppeteer.launch(launchOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Puppeteer launch timeout")), 60000),
      ),
    ]);

    const page = await browser.newPage();
    
    // Set a real User-Agent to avoid being blocked
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    
    await page.setDefaultTimeout(60000);
    await page.setDefaultNavigationTimeout(60000);

    await page.goto("https://www.student.apamaravathi.in/mymarks.php", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await page.waitForSelector('input[name="rno"]');

    await page.type('input[name="rno"]', pin);

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
    ]);

    // Wait specifically for a table to ensure results are loaded
    try {
      await page.waitForSelector("table", { timeout: 10000 });
    } catch (e) {
      console.log("⚠️ No table found immediately, attempting to parse anyway...");
    }

    const data = await page.evaluate(() => {
      const clean = (s) => (s || "").replace(/\s+/g, " ").trim();

      // Extract basic student details
      let studentName = "";
      let rollNumber = "";

      const allTextNodes = Array.from(
        document.querySelectorAll(
          "td,th,div,p,span,b,strong,center,font,h1,h2,h3",
        ),
      );
      for (const n of allTextNodes) {
        const txt = clean(n.innerText).toLowerCase();
        if (!studentName && /\bname\b\s*[:\-]/i.test(n.innerText)) {
          const m = n.innerText.match(/name\s*[:\-]\s*([^\r\n]+)/i);
          if (m) {
            const potentialName = clean(m[1]);
            if (
              potentialName &&
              potentialName.length > 1 &&
              !/^[<>=≥≤]/.test(potentialName)
            ) {
              studentName = potentialName;
            }
          }
        }
        if (
          !rollNumber &&
          /(hall ticket|roll no|roll number|rno|register no|reg no)/i.test(
            n.innerText,
          )
        ) {
          const m = n.innerText.match(
            /(?:hall ticket|roll no(?:\.|umber)?|rno|register no|reg no)\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i,
          );
          if (m) rollNumber = clean(m[1]);
        }
      }

      // NEW: Fallback for name in H1/H2/H3 tags if not found by label
      if (!studentName) {
        const headers = Array.from(document.querySelectorAll("h1, h2, h3"));
        const ignoreWords = [
          "college",
          "university",
          "institute",
          "technology",
          "engineering",
          "autonomous",
          "grade",
          "marks",
          "result",
          "memorandum",
          "sheet",
          "mvrs",
          "semester",
          "branch",
          "date",
          "page",
          "controller",
          "examinations",
        ];

        for (const h of headers) {
          const txt = clean(h.innerText);
          if (!txt) continue;
          const lower = txt.toLowerCase();
          if (
            !/\d/.test(txt) &&
            txt.includes(" ") &&
            txt.length > 3 &&
            !ignoreWords.some((w) => lower.includes(w))
          ) {
            studentName = txt;
            break;
          }
        }
      }

      // Helper: normalize and detect semester heading text
      const isSemesterHeading = (txt) => {
        if (!txt) return false;
        const t = txt.replace(/\s+/g, " ").trim();
        return (
          /(?:^|\s)(?:semester|sem)\b[\s:\-]*([ivx]+|\d+)/i.test(t) ||
          /\bsem\b\s*[-:.]?\s*([ivx]+|\d+)/i.test(t)
        );
      };

      const allElements = Array.from(document.querySelectorAll("*"));
      const semesterHeads = [];
      allElements.forEach((el, idx) => {
        const txt = clean(el.innerText || "");
        if (!txt) return;
        if (isSemesterHeading(txt)) {
          const m = txt.match(/(?:semester|sem)\s*[:\-.]?\s*([ivx\d]+)/i);
          const semLabel = m ? m[1].toString().toUpperCase() : txt;
          semesterHeads.push({ el, idx, text: txt, semLabel });
        }
      });

      // If no explicit semester headings found, try fallback: find 'SEM' occurrences
      if (semesterHeads.length === 0) {
        allElements.forEach((el, idx) => {
          const txt = clean(el.innerText || "");
          if (/\bsem\b\s*[:\-.]?\s*([ivx\d]+)/i.test(txt) || /semester/i.test(txt)) {
            const m = txt.match(/(?:semester|sem)\s*[:\-]?\s*([ivx\d]+)/i);
            const semLabel = m ? m[1].toString().toUpperCase() : txt;
            semesterHeads.push({ el, idx, text: txt, semLabel });
          }
        });
      }

      // Build sections between semester headings
      const semesters = [];
      for (let i = 0; i < semesterHeads.length; i++) {
        const start = semesterHeads[i].idx;
        const end =
          i + 1 < semesterHeads.length
            ? semesterHeads[i + 1].idx
            : allElements.length;
        const sectionEls = allElements.slice(start, end);
        const sectionText = sectionEls
          .map((e) => clean(e.innerText || ""))
          .join(" \n ");

        // Collect tables inside this section
        const tables = sectionEls.filter((e) => e.tagName === "TABLE");

        const subjects = [];
        // Parse each table for subject rows
        for (const table of tables) {
          const rows = Array.from(table.querySelectorAll("tr"));
          let headerMap = null;
          for (const tr of rows) {
            const cells = Array.from(tr.querySelectorAll("th,td")).map((c) =>
              clean(c.innerText || ""),
            );
            const low = cells.join(" ").toLowerCase();
            // detect header
            if (
              low.includes("subject") ||
              low.includes("code") ||
              low.includes("internal") ||
              low.includes("external") ||
              low.includes("grade") ||
              low.includes("credit")
            ) {
              headerMap = {};
              cells.forEach((h, idx) => {
                const hh = h.toLowerCase();
                if (hh.includes("code")) headerMap.code = idx;
                else if (hh.includes("subject")) headerMap.name = idx;
                else if (hh.includes("internal")) headerMap.internal = idx;
                else if (hh.includes("external")) headerMap.external = idx;
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
                else if (hh.includes("point") || hh.includes("points"))
                  headerMap.points = idx;
                else if (hh.includes("grade")) headerMap.grade = idx;
                else if (hh.includes("credit")) headerMap.credits = idx;
              });
              continue;
            }

            // skip empty or short rows
            if (!cells || cells.length < 2) continue;

            // If headerMap exists, map accordingly
            if (headerMap) {
              const subj = {
                subjectCode:
                  headerMap.code != null ? cells[headerMap.code] || "" : "",
                subjectName:
                  headerMap.name != null ? cells[headerMap.name] || "" : "",
                gradePoint:
                  headerMap.gradePoint != null
                    ? cells[headerMap.gradePoint] || ""
                    : headerMap.total != null
                      ? cells[headerMap.total] || ""
                      : "",
                grade:
                  headerMap.grade != null ? cells[headerMap.grade] || "" : "",
                status:
                  headerMap.status != null ? cells[headerMap.status] || "" : "",
                credit:
                  headerMap.credits != null
                    ? cells[headerMap.credits] || ""
                    : "",
                points:
                  headerMap.points != null ? cells[headerMap.points] || "" : "",
              };
              // avoid header-like rows accidentally captured
              if (subj.subjectCode || subj.subjectName) subjects.push(subj);
            } else {
              // No header: attempt positional mapping when many columns exist
              if (cells.length >= 6) {
                const subj = {
                  subjectCode: cells[0] || "",
                  subjectName: cells[1] || "",
                  gradePoint: cells[2] || "",
                  grade: cells[3] || "",
                  status: cells[4] || "",
                  credit: cells[5] || "",
                  points: cells[6] || "",
                };
                subjects.push(subj);
              } else if (cells.length >= 3) {
                // minimal mapping: code, name, total
                const subj = {
                  subjectCode: cells[0] || "",
                  subjectName: cells[1] || "",
                  gradePoint: "",
                  grade: "",
                  status: "",
                  credit: cells[2] || "",
                  points: "",
                };
                subjects.push(subj);
              }
            }
          }
        }

        // Find sgpa and cgpa inside section text
        let sgpa = "";
        let cgpa = "";
        const m1 = sectionText.match(/sgpa\s*[:\-]?\s*=?\s*([\d.]+)/i);
        const m2 = sectionText.match(/cgpa\s*[:\-]?\s*=?\s*([\d.]+)/i);
        if (m1) sgpa = m1[1].trim();
        if (m2) cgpa = m2[1].trim();

        semesters.push({
          semester: semesterHeads[i].semLabel || semesterHeads[i].text,
          subjects,
          sgpa,
          cgpa,
        });
      }

      // If no semesters detected but there are tables on page, attempt single-semester fallback
      if (semesters.length === 0) {
        const allTables = Array.from(document.querySelectorAll("table"));
        const subjects = [];
        for (const table of allTables) {
          const rows = Array.from(table.querySelectorAll("tr"));
          let headerMap = null;
          for (const tr of rows) {
            const cells = Array.from(tr.querySelectorAll("th,td")).map((c) =>
              clean(c.innerText || ""),
            );
            const low = cells.join(" ").toLowerCase();
            if (
              low.includes("subject") ||
              low.includes("code") ||
              low.includes("internal")
            ) {
              headerMap = {};
              cells.forEach((h, idx) => {
                const hh = h.toLowerCase();
                if (hh.includes("code")) headerMap.code = idx;
                else if (hh.includes("subject")) headerMap.name = idx;
                else if (hh.includes("internal")) headerMap.internal = idx;
                else if (hh.includes("external")) headerMap.external = idx;
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
                else if (hh.includes("point") || hh.includes("points"))
                  headerMap.points = idx;
                else if (hh.includes("grade")) headerMap.grade = idx;
                else if (hh.includes("credit")) headerMap.credits = idx;
              });
              continue;
            }
            if (!cells || cells.length < 2) continue;
            if (headerMap) {
              const subj = {
                subjectCode:
                  headerMap.code != null ? cells[headerMap.code] || "" : "",
                subjectName:
                  headerMap.name != null ? cells[headerMap.name] || "" : "",
                gradePoint:
                  headerMap.gradePoint != null
                    ? cells[headerMap.gradePoint] || ""
                    : headerMap.total != null
                      ? cells[headerMap.total] || ""
                      : "",
                grade:
                  headerMap.grade != null ? cells[headerMap.grade] || "" : "",
                status:
                  headerMap.status != null ? cells[headerMap.status] || "" : "",
                credit:
                  headerMap.credits != null
                    ? cells[headerMap.credits] || ""
                    : "",
                points:
                  headerMap.points != null ? cells[headerMap.points] || "" : "",
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
          }
        }
        const bodyText = clean(document.body.innerText || "");
        const sgpa =
          (bodyText.match(/sgpa\s*[:\-]?\s*([\d.]+)/i) || [])[1] || "";
        const cgpa =
          (bodyText.match(/cgpa\s*[:\-]?\s*([\d.]+)/i) || [])[1] || "";
        semesters.push({ semester: "1", subjects, sgpa, cgpa });
      }

      // Clean and deduplicate semesters and subjects, remove unhelpful repetitions
      const semMap = new Map();
      for (const s of semesters) {
        // FIX: Normalize key to ensure "Semester 3" (header) and "Sem 3" (footer) merge
        let key = (s.semester || "").toString().replace(/\s+/g, " ").trim();
        const keyMatch = key.match(/(?:sem|semester|^)\s*[:\-.]?\s*([ivx\d]+)/i);
        if (keyMatch) {
          key = keyMatch[1].toUpperCase(); // Becomes "3", "III", "4", etc.
        }

        if (!key) continue;

        // dedupe subjects within this semester
        const subjSeen = new Set();
        const cleanSubjects = [];
        (s.subjects || []).forEach((sub) => {
          const code = (sub.subjectCode || "").toString().trim();
          const nameSub = (sub.subjectName || "").toString().trim();
          const subKey = `${code}|${nameSub}`;

          // Skip legend/grading scale rows
          // Skip comparison operators at start (>=, <=, <, >, etc.)
          if (
            /^[<>≥≤=]/.test(code) ||
            code.startsWith("&gt;") ||
            code.startsWith("&lt;")
          )
            return;

          // Extra robust filtering for grading scale rows
          if (/^>=|≥|&gt;=|&ge;/.test(code)) return;
          if (/^<|&lt;/.test(code)) return;
          if (code.includes("90") && /superior/i.test(nameSub)) return;
          if (code.includes("80") && /excellent/i.test(nameSub)) return;
          if (code.includes("70") && /very good/i.test(nameSub)) return;
          if (code.includes("60") && /good/i.test(nameSub)) return;
          if (code.includes("50") && /average/i.test(nameSub)) return;
          if (code.includes("40") && /pass/i.test(nameSub)) return;
          if (code.includes("40") && /fail/i.test(nameSub)) return;
          if (code.includes("6.5") && code.includes("7.5")) return;

          // Skip grading table rows and class award rows
          if (
            /^(Range|Class Awarded|Letter Grade|Grade Points)/i.test(code) ||
            /^(Range|Class Awarded|Letter Grade|Grade Points)/i.test(nameSub) ||
            code.includes("Range in which") ||
            nameSub.includes("Range in which")
          )
            return;
          if (/^>=/.test(code) || /^≥/.test(code)) return;
          // Skip "Absent" row in grading table (often code is "-")
          if ((code === "-" || code === "–") && /absent/i.test(nameSub)) return;
          // Skip grade descriptors
          if (
            /^(superior|excellent|very good|good|average|pass|fail|withdrawn|incomplete|absent)$/i.test(
              nameSub,
            )
          )
            return;
          // Skip GPA ranges like "≥ 6.5 < 7.5"
          if (/^[≥≤><].*\d+\.\d+/.test(code)) return;
          // Skip rows with just numbers (like 10, 9, 8 for grade points)
          if (
            /^\d+$/.test(code) &&
            /^[A-Z]|\s/.test(nameSub) &&
            nameSub.length < 20
          ) {
            if (
              /superior|excellent|very good|good|average|pass|fail|absent/i.test(
                nameSub,
              )
            )
              return;
          }
          // Skip if both are empty
          if (!code && !nameSub) return;

          if (!subjSeen.has(subKey)) {
            subjSeen.add(subKey);
            cleanSubjects.push({
              subjectCode: code,
              subjectName: nameSub,
              gradePoint: (sub.gradePoint || sub.total || "").toString().trim(),
              grade: (sub.grade || "").toString().trim(),
              status: (sub.status || "").toString().trim(),
              credit: (sub.credit || sub.credits || "").toString().trim(),
              points: (sub.points || "").toString().trim(),
            });
          }
        });

        const existing = semMap.get(key);
        if (!existing) {
          semMap.set(key, {
            semester: key,
            subjects: cleanSubjects,
            sgpa: s.sgpa || "",
            cgpa: s.cgpa || "",
          });
        } else {
          // merge: prefer subjects if existing empty
          if (
            (!existing.subjects || existing.subjects.length === 0) &&
            cleanSubjects.length
          ) {
            existing.subjects = cleanSubjects;
          } else {
            // append any new subjects
            const existSet = new Set(
              existing.subjects.map(
                (ss) =>
                  `${(ss.subjectCode || "").trim()}|${(ss.subjectName || "").trim()}`,
              ),
            );
            cleanSubjects.forEach((cs) => {
              const k = `${cs.subjectCode}|${cs.subjectName}`;
              if (!existSet.has(k)) {
                existing.subjects.push(cs);
                existSet.add(k);
              }
            });
          }
          if (!existing.sgpa && s.sgpa) existing.sgpa = s.sgpa;
          if (!existing.cgpa && s.cgpa) existing.cgpa = s.cgpa;
        }
      }

      // assemble cleaned quarters and filter meaningless entries
      const cleanedSemesters = [];
      for (const sem of semMap.values()) {
        if ((sem.subjects && sem.subjects.length) || sem.sgpa || sem.cgpa)
          cleanedSemesters.push(sem);
      }

      // helper to sort semesters numerically when possible
      const semNum = (label) => {
        if (!label) return 999;
        const m = label.match(/(\d+)/);
        if (m) return parseInt(m[1], 10);
        const rom = (label.match(/[IVXLCDM]+/i) || [])[0];
        if (rom) {
          const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
          const s = rom.toUpperCase();
          let num = 0;
          for (let i = 0; i < s.length; i++) {
            const v = map[s[i]] || 0;
            const n = map[s[i + 1]] || 0;
            if (n > v) num -= v;
            else num += v;
          }
          return num;
        }
        return 999;
      };

      cleanedSemesters.sort((a, b) => semNum(a.semester) - semNum(b.semester));

      // Compute missing points where possible (points = gradePoint * credit)
      cleanedSemesters.forEach((sem) => {
        (sem.subjects || []).forEach((sub) => {
          if (!sub.points || sub.points === "") {
            const gp = parseFloat(
              (sub.gradePoint || "").replace(/[^0-9.\-]/g, ""),
            );
            const cr = parseFloat((sub.credit || "").replace(/[^0-9.\-]/g, ""));
            if (!isNaN(gp) && !isNaN(cr)) {
              sub.points = (gp * cr).toFixed(2);
            }
          }
        });
      });

      // Fallbacks: if name or roll not found above, try body-text regex search
      const pageText = clean(document.body.innerText || "");
      if (!studentName) {
        const m = pageText.match(
          /(?:name|student name|student's name)\s*[:\-]?\s*([^\r\n\t]+)/i,
        );
        if (m) {
          const namePart = clean(m[1]);
          // Extract just the name part before any numbers or extra text
          const nameOnly = namePart.split(
            /\s*\(|\s*\[|\s+\d|\s+[A-Z]\d{2}|\s+[A-Za-z0-9-\/]+$/,
          )[0];
          if (nameOnly && nameOnly.length > 1 && !/^[<>=≥≤]/.test(nameOnly)) {
            studentName = clean(nameOnly);
          }
        }
      }
      if (!rollNumber) {
        const m2 = pageText.match(
          /(?:hall\s*ticket|hallticket|roll\s*no(?:\.|umber)?|rno|register\s*no|reg\s*no)\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i,
        );
        if (m2) rollNumber = clean(m2[1]);
      }

      // Backwards-compatible top-level fields used by the UI
      const firstSem =
        cleanedSemesters && cleanedSemesters.length
          ? cleanedSemesters[0]
          : null;
      const name = studentName || "";
      const semester = firstSem ? firstSem.semester || "" : "";
      const sgpa = firstSem ? firstSem.sgpa || "" : "";
      const cgpa = firstSem ? firstSem.cgpa || "" : "";

      return {
        studentName,
        rollNumber,
        semesters: cleanedSemesters,
        name,
        semester,
        sgpa,
        cgpa,
      };
    });

    return data;
  } catch (err) {
    console.error("Scraper Error:", err.message);

    // Provide user-friendly error messages
    if (err.message.includes("timeout") || err.message.includes("Timeout")) {
      throw new Error(
        "Request timed out. The website might be slow or unreachable.",
      );
    } else if (
      err.message.includes("ERR_NAME_NOT_RESOLVED") ||
      err.message.includes("ENOTFOUND")
    ) {
      throw new Error(
        "Cannot reach the result website. Please check your internet connection.",
      );
    } else if (
      err.message.includes("Invalid PIN") ||
      err.message.includes("No result")
    ) {
      throw new Error(
        "No result found for this PIN. Please verify and try again.",
      );
    }

    throw err;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { getResult };
