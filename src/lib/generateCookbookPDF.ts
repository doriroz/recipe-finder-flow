import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { CookbookSettings, CookbookRecipe } from "@/types/cookbook";

/**
 * Renders a hidden HTML element styled like the cookbook,
 * captures it with html2canvas, and compiles pages into a PDF.
 */
export async function generateCookbookPDF(
  settings: CookbookSettings,
  recipes: CookbookRecipe[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const theme = settings.colorTheme;
  const pageWidth = 842; // A4 landscape width in px (approx)
  const pageHeight = 595; // A4 landscape height in px (approx)

  // Create a container for rendering pages off-screen
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = `${pageWidth}px`;
  container.style.direction = "rtl";
  container.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";
  document.body.appendChild(container);

  const pages: HTMLDivElement[] = [];

  // Helper to create a page div
  const makePage = (): HTMLDivElement => {
    const page = document.createElement("div");
    page.style.width = `${pageWidth}px`;
    page.style.height = `${pageHeight}px`;
    page.style.backgroundColor = theme.background;
    page.style.overflow = "hidden";
    page.style.position = "relative";
    page.style.boxSizing = "border-box";
    return page;
  };

  // --- Cover Page ---
  const cover = makePage();
  cover.innerHTML = `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px;background:linear-gradient(135deg, ${theme.background}, ${theme.secondary});">
      <div style="font-size:60px;margin-bottom:20px;">📖</div>
      <h1 style="font-size:42px;font-weight:bold;color:${theme.primary};margin:0 0 12px 0;font-family:serif;">${settings.title}</h1>
      ${settings.subtitle ? `<p style="font-size:22px;color:${theme.accent};margin:0;">${settings.subtitle}</p>` : ""}
      <p style="font-size:16px;color:#999;margin-top:40px;">${recipes.length} מתכונים</p>
    </div>
  `;
  pages.push(cover);

  // --- Table of Contents ---
  if (settings.includeTableOfContents) {
    const toc = makePage();
    const tocItems = recipes
      .map(
        (r, i) =>
          `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed ${theme.secondary};">
            <span style="font-size:16px;color:#333;">${r.galleryItem.recipe?.title || "מנה ללא שם"}</span>
            <span style="font-size:14px;color:${theme.accent};font-weight:600;">${i + 3}</span>
          </div>`
      )
      .join("");
    toc.innerHTML = `
      <div style="padding:50px 60px;">
        <h2 style="font-size:28px;font-weight:bold;color:${theme.primary};text-align:center;margin-bottom:30px;font-family:serif;">תוכן העניינים</h2>
        ${tocItems}
      </div>
    `;
    pages.push(toc);
  }

  // --- Recipe Pages ---
  for (const recipe of recipes) {
    const recipeData = recipe.galleryItem.recipe;
    const page = makePage();
    page.style.display = "grid";
    page.style.gridTemplateColumns = "1fr 1fr";

    const ingredientsList = (recipeData?.ingredients as Array<{ name: string; amount?: string; unit?: string }> || [])
      .map(
        (ing) =>
          `<li style="margin-bottom:4px;font-size:13px;"><span style="color:${theme.accent};">•</span> ${ing.amount ? ing.amount + " " : ""}${ing.unit ? ing.unit + " " : ""}${ing.name}</li>`
      )
      .join("");

    const instructionsList = (recipeData?.instructions || [])
      .map(
        (step, i) =>
          `<li style="margin-bottom:6px;font-size:13px;"><span style="font-weight:bold;color:${theme.accent};">${i + 1}.</span> ${step}</li>`
      )
      .join("");

    const noteHtml =
      settings.includePersonalNotes && recipe.personalNote
        ? `<div style="margin-top:12px;padding:10px;background:${theme.secondary};border-radius:8px;font-size:12px;font-style:italic;">💭 ${recipe.personalNote}</div>`
        : "";

    page.innerHTML = `
      <div style="overflow:hidden;position:relative;">
        <img src="${recipe.galleryItem.image_url}" crossorigin="anonymous" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <div style="padding:30px;overflow:hidden;">
        <h3 style="font-size:24px;font-weight:bold;color:${theme.primary};margin:0 0 8px 0;font-family:serif;">${recipeData?.title || "מנה ללא שם"}</h3>
        ${recipeData?.cooking_time ? `<p style="font-size:13px;color:${theme.accent};margin-bottom:16px;">זמן הכנה: ${recipeData.cooking_time} דקות</p>` : ""}
        <h4 style="font-size:16px;font-weight:600;color:${theme.primary};margin-bottom:8px;">מצרכים</h4>
        <ul style="list-style:none;padding:0;margin:0 0 16px 0;">${ingredientsList}</ul>
        <h4 style="font-size:16px;font-weight:600;color:${theme.primary};margin-bottom:8px;">הוראות הכנה</h4>
        <ol style="list-style:none;padding:0;margin:0;">${instructionsList}</ol>
        ${noteHtml}
      </div>
    `;
    pages.push(page);
  }

  // --- Back Cover ---
  const back = makePage();
  back.innerHTML = `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px;background:${theme.background};">
      <p style="font-size:22px;font-family:serif;color:${theme.primary};margin-bottom:20px;">${settings.title}</p>
      <p style="font-size:13px;color:#999;">נוצר באמצעות מה שיש</p>
    </div>
  `;
  pages.push(back);

  // --- Render to PDF ---
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [pageWidth, pageHeight] });
  const total = pages.length;

  for (let i = 0; i < pages.length; i++) {
    onProgress?.(i + 1, total);
    container.innerHTML = "";
    container.appendChild(pages[i]);

    // Wait a tick for images to load
    await new Promise((r) => setTimeout(r, 200));

    const canvas = await html2canvas(pages[i], {
      width: pageWidth,
      height: pageHeight,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: theme.background,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight);
  }

  document.body.removeChild(container);

  return pdf.output("blob");
}
