import { assetUrl } from "./asset-url";

const assets = {
  "main-0": {
    "imgFeatherXSquare": "figma/590e7b15-bfa8-404f-9a42-52d9e0478d65.svg",
    "imgFeatherFileText": "figma/f1cc55ce-810f-4467-98f9-d444e648a218.svg",
    "imgFeatherCalendar": "figma/f4ce1e8e-07be-4fa5-a96b-faafc227cb2f.svg"
  },
  "main-1": {
    "imgFeatherRotateCcw": "figma/89077080-9ddc-40a9-8c49-e1d02f2c07a2.svg",
    "imgFeatherSearch": "figma/a1c5d2ed-7500-42d8-adf7-d3177be24f6c.svg",
    "imgChoiceMarkStateSelected": "figma/90de5c6a-d14d-4e2d-b2bf-785838582828.svg"
  },
  "main-2": {
    "imgFeatherChevronRight": "figma/221021d8-c77e-444e-83e9-b53258bec1be.svg",
    "imgFeatherFilter": "figma/a81e708b-88e2-4e30-9d8d-daccc29e7dd1.svg",
    "imgFeatherPackage": "figma/3c2218be-5990-4898-b153-6da3634f777b.svg",
    "imgFeatherShoppingBag": "figma/42fa2b4d-2931-4c34-9af9-50e35aab58cc.svg"
  },
  "main-3": {
    "imgFeatherFilter": "figma/5171d3ec-385c-4850-b308-cf2fc5482db4.svg"
  },
  "203-701": {
    "imgFeatherCamera": "figma/41022345-8fa2-43d2-9eb9-f213dfc440f4.svg",
    "imgFeatherImage": "figma/020a9e71-9da7-41d0-bb16-bf18e64c1073.svg",
    "imgFeatherMoreHorizontal": "figma/dc493ed8-da70-4c1a-a769-fc11389c7c83.svg",
    "imgFeatherArrowLeft": "figma/ada3900a-62f6-482d-9613-58c13515c53e.svg",
    "imgFeatherMaximize": "figma/d7dc5686-11f4-412e-9cde-c7c61944663a.svg",
    "imgFeatherClock": "figma/3b26872b-576b-4f52-b659-ba84c5410cc1.svg",
    "imgFeatherCalendar": "figma/53ca5deb-573f-4e33-b1ac-9da7f1bdb528.svg",
    "imgFeatherPackage": "figma/40b35cf2-9212-4c17-bc6d-8fe395f555ed.svg",
    "imgFeatherTrash2": "figma/aacec322-1369-446c-9efb-fac358a71f05.svg",
    "imgFeatherRepeat": "figma/e8e1d12f-f86b-4801-a63b-0ca50b509dc4.svg",
    "imgFeatherCornerUpLeft": "figma/dbfc63fb-23c4-48bd-96a6-fada50e48e31.svg",
    "imgFeatherCalendar1": "figma/53722948-17f5-40e6-858b-6bc0d9739927.svg"
  },
  "203-847": {
    "imgFeatherCamera": "figma/e9bcc8ea-c22f-43cc-ba8f-376ee57f27be.svg",
    "imgFeatherImage": "figma/3daa083a-76fa-4fcd-9107-22a09d6af181.svg",
    "imgFeatherMoreHorizontal": "figma/7f618d21-fac5-40b4-8bcf-c561c3fb0128.svg",
    "imgFeatherArrowLeft": "figma/ad4d1e8c-e626-4861-a6b7-a0371dd06a4a.svg",
    "imgFeatherMaximize": "figma/08f2179f-8ded-4454-925a-4c4508ae20d4.svg",
    "imgFeatherAlertTriangle": "figma/28bf766f-3e77-41f0-88fe-c297be0077cd.svg",
    "imgFeatherAlertTriangle1": "figma/8c5174d6-f488-449f-9dd1-094c38adbd56.svg",
    "imgFeatherClock": "figma/d02c5cc5-e997-4144-8784-122484396ac6.svg",
    "imgFeatherCalendar": "figma/b684c0dc-e5ca-4302-a906-df25869aa1cd.svg",
    "imgFeatherTrash2": "figma/c70103f4-5a84-4dbe-a041-9bf687cd8e5e.svg",
    "imgFeatherCalendar1": "figma/47be953a-ede7-41de-8645-348d0d0bfb15.svg"
  },
  "279-1299": {
    "imgFeatherImage": "figma/63f9c2b0-78c9-43eb-a9e6-03ab501b3617.svg",
    "imgOrderBadge": "figma/e90d400c-09f3-424c-9c79-669114cde678.svg",
    "imgFeatherArrowLeft": "figma/c6190560-4ae7-4874-aa1e-0edf2d642d40.svg",
    "imgFeatherAlertCircle": "figma/784b2181-1edf-417f-bb55-766b95e1db98.svg"
  },
  "279-1398": {
    "imgFeatherMaximize": "figma/29585ac6-4af7-4f2f-a308-2b24ab118b3e.svg",
    "imgFeatherX": "figma/a1ba582c-1acd-4eb7-9c07-7690f13ffe77.svg"
  },
  "280-1915": {
    "imgFeatherImage": "figma/99210311-8efc-40b0-90d3-678c683d536d.svg",
    "imgOrderBadge": "figma/07032e06-0efb-4f81-aef0-1380425c892d.svg",
    "imgFeatherArrowLeft": "figma/a4b8edff-abd0-475a-8aba-10d1b24b96ee.svg",
    "imgFeatherWifiOff": "figma/ddb4cb22-4551-4d3b-9e44-a5a7a760bf30.svg"
  },
  "124-445": {
    "imgFeatherChevronRight": "figma/776547d4-f947-42d1-ab74-c3c6dbe8e1c3.svg",
    "imgCheck": "figma/27069a12-515b-44a1-b326-2eb2f7461540.svg",
    "imgFeatherFilter": "figma/4d8832d9-df5c-47dc-b9f9-d760b0152bcc.svg",
    "imgFeatherPackage": "figma/2d129d38-8f7a-4a2b-9522-9b14fae2f3f3.svg",
    "imgFeatherShoppingBag": "figma/e0cd73ff-7224-47c4-8cf1-40becb327875.svg",
    "imgFileDown": "figma/3b16ac6d-15fb-4ab0-a558-f901250e4e9f.svg"
  },
  "215-1147": {
    "imgFeatherImage": "figma/49b3c989-6b7e-4137-a34b-cc4f6e2685e6.svg",
    "imgFeatherImage1": "figma/61b83328-dd67-4742-941d-3a4189eacd21.svg",
    "imgFeatherCamera": "figma/d21eabcd-7238-4274-b2e4-c74157954d61.svg",
    "imgFeatherImage2": "figma/654fd03a-05b9-4ca4-a219-5bb64db65091.svg",
    "imgFeatherMoreHorizontal": "figma/736c4d81-9be8-4c73-a00e-6ea1dc2cbb8e.svg",
    "imgFeatherArrowLeft": "figma/18fb059a-d101-456d-81d2-c170cfac6013.svg",
    "imgFeatherMaximize": "figma/ca8b8d5f-5005-4f2e-bde0-59e1926986a2.svg",
    "imgFeatherAlertTriangle": "figma/10fd6bdc-d2fc-4d47-a41a-67803006f552.svg",
    "imgFeatherClock": "figma/6865c1a5-9826-4981-be10-e8931bf4c0c1.svg",
    "imgFeatherCalendar": "figma/8405cec3-675b-45de-a547-1a917d0f8eac.svg",
    "imgFeatherTrash2": "figma/3bf48cbf-6c4c-4110-b22f-da21afce6e64.svg",
    "imgFeatherCalendar1": "figma/376fdf75-293a-4f82-a661-69b87c34871a.svg",
    "imgCloseIcon": "figma/1e321dba-958d-4e30-9c5e-b672d0c154b7.svg",
    "imgDeleteIcon": "figma/3b9bd49d-678d-4405-b055-e95bcfd609c6.svg",
    "imgPreviousIcon": "figma/f937ce31-bc3a-4a02-9658-b4460d9f433f.svg",
    "imgNextIcon": "figma/71feba02-f6a1-48c4-a3f0-59f8118ae141.svg"
  }
} as const;
export function figmaAsset(screen: keyof typeof assets, name: string) {
 const path = (assets[screen] as Record<string, string>)[name];
 if (!path) throw new Error(`Unknown Figma asset: ${screen}/${name}`);
 return assetUrl(path);
}
