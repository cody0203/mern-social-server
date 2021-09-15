export const postPopulateQuery = [
  { path: "owner", select: "name" },
  {
    path: "comments",
    populate: [
      {
        path: "replies",
        populate: [
          {
            path: "owner",
            select: "name",
          },
          { path: "owner", select: "name" },
        ],
      },
      { path: "owner", select: "name" },
    ],
  },
];

export const commentPopulateQuery = [
  {
    path: "replies",
    populate: {
      path: "replier",
      select: "name",
    },
  },
  { path: "owner", select: "name" },
];
