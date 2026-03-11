import { Container } from "./Container/Container";
import { Text } from "./Text/Text";
import { Page } from "./Page/Page";
import { Viewport } from "./Viewport/Viewport";
import { Image } from "./Image/Image";
import { Button } from "./Button/Button";
import { Divider } from "./Divider/Divider";
import { Section } from "./Section/Section";
import { Row } from "./Row/Row";
import { Column } from "./Column/Column";
import { Icon } from "./Icon/Icon";
import { Frame } from "./Frame/Frame";
import { ImportedBlock } from "./ImportedBlock/ImportedBlock";

export const RenderBlocks: Record<string, any> = {
  Container,
  container: Container,
  Text,
  text: Text,
  Page,
  page: Page,
  Viewport,
  viewport: Viewport,
  Image,
  image: Image,
  Button,
  button: Button,
  Divider,
  Section,
  section: Section,
  Row,
  row: Row,
  Column,
  column: Column,
  Icon,
  icon: Icon,
  Frame,
  frame: Frame,
  ImportedBlock,
  importedblock: ImportedBlock,
};
