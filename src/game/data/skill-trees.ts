/** This-run skill trees. 3 branches × 3 rungs. Guns walk 2 lines. Crafts take 3 nodes. */

export type TreeKind = "gun" | "craft";

export type TreeNode = {
  id: string;
  name: string;
  blurb: string;
  cap?: boolean;
};

export type TreeBranch = {
  id: string;
  name: string;
  job: string;
  nodes: [TreeNode, TreeNode, TreeNode];
};

export type SkillTree = {
  id: string;
  name: string;
  kind: TreeKind;
  job: string;
  picks: number;
  branchesMax: number;
  branches: [TreeBranch, TreeBranch, TreeBranch];
};

export const SKILL_TREES: SkillTree[] = [
  {
    id: "spike",
    name: "Lance",
    kind: "gun",
    job: "A lance. Punches through the warp lane.",
    picks: 5,
    branchesMax: 2,
    branches: [
      {
        id: "pierce",
        name: "Spine",
        job: "More hulls in the wedge",
        nodes: [
          { id: "spike-p1", name: "Fourth hull", blurb: "One more enemy in the line." },
          { id: "spike-p2", name: "Far mare", blurb: "The wedge reaches the next clump." },
          { id: "spike-p3", name: "Lane lance", blurb: "The whole wedge is a spear down the lane.", cap: true },
        ],
      },
      {
        id: "hot",
        name: "Sol",
        job: "Shots cook",
        nodes: [
          { id: "spike-h1", name: "Sun tip", blurb: "Shots light them on fire." },
          { id: "spike-h2", name: "Hop sol", blurb: "Fire jumps to the one behind." },
          { id: "spike-h3", name: "Solar ring", blurb: "Slam is a fire ring.", cap: true },
        ],
      },
      {
        id: "peel",
        name: "Strip",
        job: "Strips hull plates",
        nodes: [
          { id: "spike-e1", name: "Hull saw", blurb: "Strips plates in the wedge." },
          { id: "spike-e2", name: "Open hull", blurb: "Stripped hulls take real hurt." },
          { id: "spike-e3", name: "Bare hull", blurb: "Plates in the wedge count as no armor.", cap: true },
        ],
      },
    ],
  },
  {
    id: "arc",
    name: "Ion",
    kind: "gun",
    job: "Ion spark. Jumps enemy to enemy.",
    picks: 5,
    branchesMax: 2,
    branches: [
      {
        id: "jump",
        name: "Storm",
        job: "Longer chain",
        nodes: [
          { id: "arc-j1", name: "Extra hop", blurb: "The spark jumps one more enemy." },
          { id: "arc-j2", name: "Void hop", blurb: "Can skip a gap in the clump." },
          { id: "arc-j3", name: "Storm line", blurb: "The hop walks the whole clump.", cap: true },
        ],
      },
      {
        id: "fork",
        name: "Binary",
        job: "Two sparks",
        nodes: [
          { id: "arc-f1", name: "Twin ion", blurb: "Two sparks at once." },
          { id: "arc-f2", name: "Armor hop", blurb: "Hops strip plates." },
          { id: "arc-f3", name: "Twin storm", blurb: "Both sparks hop.", cap: true },
        ],
      },
      {
        id: "brand",
        name: "Claim",
        job: "Hops drop Credit",
        nodes: [
          { id: "arc-b1", name: "Beacon sting", blurb: "Hopped kills pay." },
          { id: "arc-b2", name: "Drift hop", blurb: "Hopped enemies crawl." },
          { id: "arc-b3", name: "Ore burst", blurb: "The clump drops a Credit burst.", cap: true },
        ],
      },
    ],
  },
  {
    id: "dish",
    name: "Well",
    kind: "gun",
    job: "A gravity well. Pulls. No shots.",
    picks: 5,
    branchesMax: 2,
    branches: [
      {
        id: "pull",
        name: "Gravity",
        job: "Drags them in",
        nodes: [
          { id: "dish-p1", name: "Hard well", blurb: "They slide into the well." },
          { id: "dish-p2", name: "Far well", blurb: "Grabs from the lane." },
          { id: "dish-p3", name: "Sticky well", blurb: "They don’t leave.", cap: true },
        ],
      },
      {
        id: "fold",
        name: "Warp",
        job: "Longer walk",
        nodes: [
          { id: "dish-f1", name: "Long walk", blurb: "Walking the well takes longer." },
          { id: "dish-f2", name: "Drift fold", blurb: "Folded enemies crawl." },
          { id: "dish-f3", name: "Eclipse", blurb: "A dark hold. They almost stop.", cap: true },
        ],
      },
      {
        id: "burn",
        name: "Star",
        job: "The well cooks",
        nodes: [
          { id: "dish-b1", name: "Hot well", blurb: "The well burns." },
          { id: "dish-b2", name: "Hop sol", blurb: "Fire leaves with them." },
          { id: "dish-b3", name: "Solar well", blurb: "A gold fire ring on slam.", cap: true },
        ],
      },
    ],
  },
  {
    id: "auger",
    name: "Auger",
    kind: "craft",
    job: "Bores a hole in the lane. Enemies in it crawl.",
    picks: 3,
    branchesMax: 2,
    branches: [
      {
        id: "trench",
        name: "Bore",
        job: "A fatter hole",
        nodes: [
          { id: "auger-t1", name: "Deep bore", blurb: "The hole chips harder." },
          { id: "auger-t2", name: "Wide bore", blurb: "Bigger hole. They slog." },
          { id: "auger-t3", name: "Storm bore", blurb: "The hole flashes and bites the clump.", cap: true },
        ],
      },
      {
        id: "plunge",
        name: "Plunge",
        job: "Drops the hole",
        nodes: [
          { id: "auger-p1", name: "Fast Plunge", blurb: "The hole drops sooner." },
          { id: "auger-p2", name: "Ore well", blurb: "Plunge drops Credit ore." },
          { id: "auger-p3", name: "Sun pit", blurb: "Plunge is a gold fire ring.", cap: true },
        ],
      },
      {
        id: "crew",
        name: "Pad",
        job: "Friends over the hole",
        nodes: [
          { id: "auger-c1", name: "Pad kiss", blurb: "Guns over the bore shoot faster." },
          { id: "auger-c2", name: "Wing cut", blurb: "Friends over the bore hit harder." },
          { id: "auger-c3", name: "Home bore", blurb: "Home’s shots punch like Auger.", cap: true },
        ],
      },
    ],
  },
  {
    id: "torch",
    name: "Torch",
    kind: "craft",
    job: "Sets them on fire. Fire hops the lane.",
    picks: 3,
    branchesMax: 2,
    branches: [
      {
        id: "roar",
        name: "Sol",
        job: "A bigger cook",
        nodes: [
          { id: "torch-r1", name: "Hotter sun", blurb: "They cook." },
          { id: "torch-r2", name: "Wide sun", blurb: "More of the lane is on fire." },
          { id: "torch-r3", name: "Solar roar", blurb: "A gold fire ring.", cap: true },
        ],
      },
      {
        id: "hop",
        name: "Chain",
        job: "Fire jumps",
        nodes: [
          { id: "torch-h1", name: "Hop burn", blurb: "Fire jumps to the next one." },
          { id: "torch-h2", name: "Storm hop", blurb: "Hop skips a gap." },
          { id: "torch-h3", name: "Chain sun", blurb: "Hop keeps going until the clump is lit.", cap: true },
        ],
      },
      {
        id: "hunt",
        name: "Dive",
        job: "She dives and eats bombs",
        nodes: [
          { id: "torch-u1", name: "Fast dive", blurb: "She zaps sooner." },
          { id: "torch-u2", name: "Eat bomb", blurb: "Snatches grenades on the way." },
          { id: "torch-u3", name: "Dive sun", blurb: "She dives the tank and lights it.", cap: true },
        ],
      },
    ],
  },
  {
    id: "boost",
    name: "Boost",
    kind: "craft",
    job: "Guns she flies by shoot faster. She eats grenades.",
    picks: 3,
    branchesMax: 2,
    branches: [
      {
        id: "engine",
        name: "Drive",
        job: "Lights guns",
        nodes: [
          { id: "boost-e1", name: "Hot drive", blurb: "Guns she passes really shoot." },
          { id: "boost-e2", name: "Wide light", blurb: "More guns light." },
          { id: "boost-e3", name: "All-pad storm", blurb: "Every gun she kissed keeps sparking.", cap: true },
        ],
      },
      {
        id: "trail",
        name: "Wake",
        job: "She is also fire",
        nodes: [
          { id: "boost-t1", name: "Burn wake", blurb: "Enemies she flies over cook." },
          { id: "boost-t2", name: "Spark ride", blurb: "Shots hitch on her wake." },
          { id: "boost-t3", name: "Sun flare", blurb: "Drive flare is a gold ring.", cap: true },
        ],
      },
      {
        id: "catch",
        name: "Net",
        job: "Eats grenades",
        nodes: [
          { id: "boost-c1", name: "Far catch", blurb: "Eats grenades from farther." },
          { id: "boost-c2", name: "Wing light", blurb: "Crafts she passes also light." },
          { id: "boost-c3", name: "Bomb well", blurb: "Snatches a whole clump of grenades.", cap: true },
        ],
      },
    ],
  },
];

export function treeOf(id: string): SkillTree | undefined {
  return SKILL_TREES.find((t) => t.id === id);
}
