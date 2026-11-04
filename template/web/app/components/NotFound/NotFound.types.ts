export type NotFoundProps = {
  /** What is missing, as the page's H1: "Order not found". */
  title: string;
  /** One line on why, such as "It may have been deleted, or the link is wrong." */
  description?: string;
  /** The way back to where the user finds another: the list's name and route. */
  back: { label: string; href: string };
};
