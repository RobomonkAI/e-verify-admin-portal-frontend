import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/DownloadForms.module.css";
import { Certificate } from "@/utils/types";
import { vendorsData } from "@/utils/helper";
import QRCode from "qrcode";
import jsPDF from "jspdf";

interface SingleDownloadFormProps {
  setMessage: (message: string) => void;
}

export const SingleDownloadForm: React.FC<SingleDownloadFormProps> = ({
  setMessage,
}) => {
  const [certificateId, setCertificateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Function to format date as dd/mm/yy
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(date);
  };

  // Function to render certificate text
  const renderCertificateText = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    certificate: Certificate
  ) => {
    // Text Styles
    ctx.font = `500 16px "ArialCustom", Arial, sans-serif`;
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "#4b0406";
    ctx.fillStyle = "#4b0406";

    // Display Student Details
    ctx.strokeText(certificate.name, 400, 200);
    ctx.fillText(certificate.name, 400, 200);

    ctx.font = `500 22px "ArialCustom", Arial, sans-serif`;
    ctx.strokeStyle = "#4b0406";
    ctx.fillStyle = "#4b0406";

    // Calculate dynamic X position
    const programTextWidth = ctx.measureText(certificate.program).width;
    const centerXPrgm = (canvas.width - programTextWidth) / 2;

    // Draw centered text
    ctx.strokeText(certificate.program, centerXPrgm, 265);
    ctx.fillText(certificate.program, centerXPrgm, 265);

    ctx.font = `500 16px "ArialCustom", Arial, sans-serif`;
    ctx.strokeStyle = "#4b0406";
    ctx.fillStyle = "#4b0406";

    // Calculate dynamic X position
    const departmentTextWidth = ctx.measureText(certificate.department).width;
    const centerXDept = (canvas.width - departmentTextWidth) / 2;

    const orgTextWidth = ctx.measureText(certificate.org).width;
    const centerXOrg = (canvas.width - orgTextWidth) / 2;

    ctx.strokeText(certificate.department, centerXDept, 320);
    ctx.fillText(certificate.department, centerXDept, 320);
    ctx.strokeText(certificate.org, centerXOrg, 370);
    ctx.fillText(certificate.org, centerXOrg, 370);

    ctx.font = `500 16px "ArialCustom", Arial, sans-serif`;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";

    // Format Dates (dd/mm/yy)
    const formattedStartDate = formatDate(certificate.startDate);
    const formattedIssueDate = formatDate(certificate.issueDate);

    ctx.strokeText(formattedStartDate, 325, 395);
    ctx.fillText(formattedStartDate, 325, 395);
    ctx.strokeText(formattedIssueDate, 495, 395);
    ctx.fillText(formattedIssueDate, 495, 395);

    ctx.font = `500 11px "ArialCustom", Arial, sans-serif`;
    ctx.strokeStyle = "#4b0406";
    ctx.fillStyle = "#4b0406";

    ctx.strokeText(certificate.certificateId, 723, 315);
    ctx.fillText(certificate.certificateId, 723, 315);

    // Generate QR Code
    QRCode.toCanvas(
      qrCanvasRef.current,
      `https://e-verify.robomonk.ai/certificate/${certificate.certificateId}`,
      {
        width: 100,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      },
      (error) => {
        if (!error && qrCanvasRef.current) {
          const qrImg = qrCanvasRef.current;
          const qrX = canvas.width - 133;
          const qrY = canvas.height - 140;
          const qrSize = 80;

          // Add white background with padding
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

          // Add subtle border
          ctx.strokeStyle = "#4b0406";
          ctx.lineWidth = 1;
          ctx.strokeRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

          // Draw QR code
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
        }
      }
    );
  };

  // Effect to render certificate when data is available
  useEffect(() => {
    if (certificate && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        let imgSrc =
          "https://res.cloudinary.com/doxrqtfxo/image/upload/v1741560885/E%20Verify%20Portal%20Assets/pbruozkwvgw6f8s9ltpc.png"; // Default to Internship

        if (certificate.type === "Workshop") {
          imgSrc =
            "https://res.cloudinary.com/dcooiidus/image/upload/v1740660460/default_blank_workshop_cert_sgu2ad.jpg"; // Use Workshop Template
        }

        if (certificate.certificateImgSrc !== "") {
          imgSrc = certificate.certificateImgSrc ?? imgSrc;
        }

        const img = new window.Image();
        img.crossOrigin = "anonymous"; // Ensure CORS support
        img.src = imgSrc;

        img.onload = async () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          await document.fonts.ready;

          // Embed Vendor Logo
          const vendor = vendorsData.find((v) => v.name === certificate.org);
          if (vendor) {
            const vendorLogo = new window.Image();
            vendorLogo.crossOrigin = "anonymous";
            vendorLogo.src = vendor.imgSrc;
            vendorLogo.onload = () => {
              ctx.drawImage(vendorLogo, 110, 60, 70, 70);

              // Continue with the rest of the rendering
              renderCertificateText(ctx, canvas, certificate);

              // Set canvas as ready after all rendering is complete
              setCanvasReady(true);
            };
          } else {
            // If no vendor logo, continue with text rendering
            renderCertificateText(ctx, canvas, certificate);
            setCanvasReady(true);
          }
        };
      }
    }
  }, [certificate, renderCertificateText]); // Add renderCertificateText to dependencies

  const downloadCertificatePDF = async () => {
    if (canvasRef.current && certificate) {
      const canvas = canvasRef.current;

      // Create a high-resolution temporary canvas
      const scale = 8; // Increased scale for even better resolution
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width * scale;
      tempCanvas.height = canvas.height * scale;
      const ctx = tempCanvas.getContext("2d", {
        alpha: true,
        willReadFrequently: true,
      });

      if (!ctx) {
        console.error("Failed to get 2D context");
        return;
      }

      // Clear and prepare the high-res canvas
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // First, draw the background image at high resolution
      const img = new window.Image();
      img.crossOrigin = "anonymous";

      // Get the current background image source
      let imgSrc =
        "https://res.cloudinary.com/doxrqtfxo/image/upload/v1741560885/E%20Verify%20Portal%20Assets/pbruozkwvgw6f8s9ltpc.png";
      if (certificate.type === "Workshop") {
        imgSrc =
          "https://res.cloudinary.com/dcooiidus/image/upload/v1740660460/default_blank_workshop_cert_sgu2ad.jpg";
      }
      if (certificate.certificateImgSrc !== "") {
        imgSrc = certificate.certificateImgSrc ?? imgSrc;
      }

      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
          resolve(true);
        };
        img.src = imgSrc;
      });

      // Draw vendor logo if available
      const vendor = vendorsData.find((v) => v.name === certificate.org);
      if (vendor) {
        const vendorLogo = new window.Image();
        vendorLogo.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          vendorLogo.onload = () => {
            ctx.drawImage(
              vendorLogo,
              110 * scale,
              60 * scale,
              70 * scale,
              70 * scale
            );
            resolve(true);
          };
          vendorLogo.src = vendor.imgSrc;
        });
      }

      // Scale context for text rendering
      ctx.scale(scale, scale);

      // Optimize text rendering
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.textRendering = "geometricPrecision";
      ctx.letterSpacing = "1px";

      // Re-render all text with enhanced quality
      // Student Name
      ctx.font = `600 16px "ArialCustom", Arial, sans-serif`;
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "#4b0406";
      ctx.fillStyle = "#4b0406";
      ctx.strokeText(certificate.name, canvas.width / 2 + 7, 195);
      ctx.fillText(certificate.name, canvas.width / 2 + 7, 195);

      // Program
      ctx.font = `600 22px "ArialCustom", Arial, sans-serif`;
      ctx.strokeStyle = "#4b0406";
      ctx.fillStyle = "#4b0406";
      ctx.strokeText(certificate.program, canvas.width / 2, 260);
      ctx.fillText(certificate.program, canvas.width / 2, 260);

      // Department and Organization
      ctx.font = `600 16px "ArialCustom", Arial, sans-serif`;
      ctx.strokeText(certificate.department, canvas.width / 2, 315);
      ctx.fillText(certificate.department, canvas.width / 2, 315);
      ctx.strokeText(certificate.org, canvas.width / 2, 365);
      ctx.fillText(certificate.org, canvas.width / 2, 365);

      // Dates
      ctx.font = `600 16px "ArialCustom", Arial, sans-serif`;
      ctx.strokeStyle = "black";
      ctx.fillStyle = "black";
      const formattedStartDate = formatDate(certificate.startDate);
      const formattedIssueDate = formatDate(certificate.issueDate);
      ctx.strokeText(formattedStartDate, 355, 390);
      ctx.fillText(formattedStartDate, 355, 390);
      ctx.strokeText(formattedIssueDate, 525, 390);
      ctx.fillText(formattedIssueDate, 525, 390);

      // Certificate ID
      ctx.font = `600 11px "ArialCustom", Arial, sans-serif`;
      ctx.strokeStyle = "#4b0406";
      ctx.fillStyle = "#4b0406";
      ctx.strokeText(certificate.certificateId, 755, 315);
      ctx.fillText(certificate.certificateId, 755, 315);

      // Generate high-quality QR code
      await new Promise((resolve) => {
        QRCode.toCanvas(
          qrCanvasRef.current,
          `https://e-verify.robomonk.ai/certificate/${certificate.certificateId}`,
          {
            width: 200 * scale,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
            errorCorrectionLevel: "H",
          },
          (error) => {
            if (!error && qrCanvasRef.current) {
              const qrX = canvas.width - 133;
              const qrY = canvas.height - 140;
              const qrSize = 80;

              // Add white background with padding
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

              // Add subtle border
              ctx.strokeStyle = "#4b0406";
              ctx.lineWidth = 1;
              ctx.strokeRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

              // Draw high-resolution QR code
              ctx.drawImage(qrCanvasRef.current, qrX, qrY, qrSize, qrSize);
              resolve(true);
            }
          }
        );
      });

      // Convert to high-quality PNG
      const imgData = tempCanvas.toDataURL("image/png", 1.0);

      // Create PDF with maximum quality settings
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
        compress: true,
        putOnlyUsedFonts: true,
        precision: 32,
        hotfixes: ["px_scaling"],
      });

      // Remove metadata and optimize
      pdf.setProperties({
        title: "",
        subject: "",
        author: "",
        keywords: "",
        creator: "",
      });

      // Add image with maximum quality
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        canvas.width,
        canvas.height,
        "",
        "FAST"
      );

      // Save the optimized PDF
      pdf.save(`${certificate.name} ${certificate.type} Certificate.pdf`);
    }
  };

  // Update the useEffect to handle async downloadCertificatePDF
  useEffect(() => {
    if (canvasReady && certificate) {
      const timer = setTimeout(async () => {
        await downloadCertificatePDF();
        setMessage("Certificate downloaded successfully!");
        setCertificate(null);
        setCanvasReady(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [canvasReady, certificate, downloadCertificatePDF, setMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!certificateId.trim()) {
      setMessage("Please enter a certificate ID");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Fetch certificate data
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${API_BASE_URL}/certificates/id/${certificateId}`
      );

      if (response.status === 404) {
        throw new Error("Certificate not found");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch certificate details");
      }

      // Get certificate data and set it to state
      const data = await response.json();
      setCertificate(data);
      setMessage("Generating certificate...");
    } catch (error) {
      console.error("Download error:", error);
      setMessage(
        error instanceof Error ? error.message : "Failed to find certificate"
      );
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <input
          type="text"
          id="certificateId"
          value={certificateId}
          onChange={(e) => setCertificateId(e.target.value)}
          className={styles.input}
          placeholder="Enter certificate ID"
          disabled={loading}
        />
      </div>

      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? "Processing..." : "Download Certificate"}
      </button>

      {/* Hidden canvases for certificate generation */}
      <div style={{ display: "none" }}>
        <canvas ref={canvasRef} width={850} height={550}></canvas>
        <canvas ref={qrCanvasRef} width={100} height={100}></canvas>
      </div>
    </form>
  );
};
