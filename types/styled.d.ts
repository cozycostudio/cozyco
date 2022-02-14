import "styled-components";
import { Theme } from "../src/components/theme";

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}
