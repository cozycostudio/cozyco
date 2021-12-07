import React from "react";
import styled from "styled-components";
import {
  DialogOverlay as ReachDialogOverlay,
  DialogContent as ReachDialogContent,
} from "@reach/dialog";
import "@reach/dialog/styles.css";

const DialogOverlay = styled(ReachDialogOverlay)`
  &[data-reach-dialog-overlay] {
    z-index: 1000;
    min-height: 100vh;
    min-height: -webkit-fill-available;
    background: ${(p) => p.theme.colors.bg};
  }
`;

const DialogContent = styled(ReachDialogContent)`
  &[data-reach-dialog-content] {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    background: ${(p) => p.theme.colors.bg};
  }
`;

interface ModalProps {
  children: React.ReactNode;
  a11yLabel: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Modal({ children, a11yLabel, isOpen, onClose }: ModalProps) {
  return (
    <DialogOverlay isOpen={isOpen} onDismiss={onClose} allowPinchZoom={true}>
      <DialogContent aria-label={a11yLabel}>{children}</DialogContent>
    </DialogOverlay>
  );
}
