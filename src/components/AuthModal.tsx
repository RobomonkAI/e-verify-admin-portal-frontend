"use client";
import React from "react";
import { Modal } from "@mui/material";
import { useAdmin } from "@/context/AdminContext";
import { useRouter } from "next/navigation";
import styles from "../styles/AdminAuthModal.module.css";
import { LoginModalProps } from "@/utils/types";

const LoginModal: React.FC<LoginModalProps> = ({ authParams }) => {
  const adminContext = useAdmin();
  const router = useRouter();

  const handleGoToLogin = () => {
    adminContext.setShowModal(false); // Close modal on redirection
    router.push("/");
  };

  return (
    <Modal
      open={true}
      className={styles.modalMainContainer}
      aria-labelledby="login-auth-modal-title"
      aria-describedby="login-auth-modal-description"
      role="dialog"
    >
      <div
        className={styles.modalContainer}
        role="alertdialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <h2 id="login-auth-modal-title" className={styles.heading}>
          Authentication Required
        </h2>
        <p id="login-auth-modal-description" className={styles.subHeading}>
          Please log in to access this page.
        </p>
        <button
          onClick={handleGoToLogin}
          className={styles.routeButton}
          aria-label={`Log in to ${authParams} portal`}
        >
          Log In
        </button>
      </div>
    </Modal>
  );
};

export default LoginModal;
