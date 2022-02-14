import { useContext } from "react";
import { ModalContext, ModalManagerContext } from "../components/ModalManager";

export function useModal(): ModalContext {
  return useContext(ModalManagerContext);
}
