import { useContext } from "react";
import { ModalContext, ModalManagerContext } from "../providers/ModalManager";

export function useModal(): ModalContext {
  return useContext(ModalManagerContext);
}
