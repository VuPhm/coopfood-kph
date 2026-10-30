import {render,screen} from "@testing-library/react";
import {describe,it,expect} from "vitest";
import {StoreAccountTrigger,storeAccountRole} from "./store-account-trigger";
import {mockProfile} from "./store-app-mock";
describe("account profile role",()=>{
 it("shows staff rather than a hardcoded manager role",()=>{render(<StoreAccountTrigger profile={{...mockProfile,role:"STAFF"}}/>);expect(screen.getByText("Nhân viên")).toBeVisible();expect(screen.queryByText("Quản lý cửa hàng")).not.toBeInTheDocument();});
 it("does not infer a role when metadata is empty",()=>{expect(storeAccountRole({...mockProfile,role:""})).toBe("Chưa có vai trò");expect(storeAccountRole({...mockProfile,role:"STORE_MANAGER"})).toBe("Quản lý cửa hàng");});
});
