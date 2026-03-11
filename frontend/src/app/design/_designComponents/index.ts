import { Container } from "./Container/Container";
import { Text } from "./Text/Text";
import { Page } from "./Page/Page";
import { Viewport } from "./Viewport/Viewport";
import { Image } from "./Image/Image";
import { Video } from "./Video/Video";
import { Button } from "./Button/Button";
import { Divider } from "./Divider/Divider";
import { Section } from "./Section/Section";
import { Row } from "./Row/Row";
import { Column } from "./Column/Column";
import { Icon } from "./Icon/Icon";
import { Tabs } from "./Tabs/Tabs";
import { Spacer } from "./Spacer/Spacer";
import { Pagination } from "./Pagination/Pagination";
import { Rating } from "./Rating/Rating";
import { ImportedBlock } from "./ImportedBlock/ImportedBlock";
import { Accordion } from "./Accordion/Accordion";

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
  Video,
  video: Video,
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
  Tabs,
  tabs: Tabs,
  Spacer,
  spacer: Spacer,
  Pagination,
  pagination: Pagination,
  Rating,
  rating: Rating,
  ImportedBlock,
  importedblock: ImportedBlock,
  Accordion,
  accordion: Accordion,
};
