import { createContext, useCallback, useState } from "react";
import { Modal } from "./Modal";

export enum ModalType {
  NONE,
}

const modalA11yLabel: Record<ModalType, string> = {
  [ModalType.NONE]: "Empty modal",
};

export interface ModalContext {
  modalType: ModalType;
  openModal: (modalType: ModalType) => void;
  closeModal: () => void;
}

export const ModalManagerContext = createContext<ModalContext>(
  {} as ModalContext
);

export default function ModalManager({ children }: { children: any }) {
  const [modalType, setModalType] = useState<ModalType>(ModalType.NONE);

  const openModal = useCallback((mt: ModalType) => {
    setModalType(mt);
  }, []);

  const closeModal = useCallback(() => {
    setModalType(ModalType.NONE);
  }, []);

  const modalMap: Record<ModalType, JSX.Element | null> = {
    [ModalType.NONE]: null,
  };

  return (
    <ModalManagerContext.Provider
      value={{
        modalType,
        openModal,
        closeModal,
      }}
    >
      <Modal
        isOpen={modalType !== ModalType.NONE}
        onClose={closeModal}
        a11yLabel={modalA11yLabel[modalType]}
      >
        {modalMap[modalType]}
      </Modal>
      {children}
    </ModalManagerContext.Provider>
  );
}
