//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
//CommonService Imports:
import { Config } from "../../../../CommonServices/Config";
import {
  IBasicDropDown,
  IDropdownDetails,
  IRightSideBarContents,
  IUserDetails,
  ITabviewDetails,
  IBasicFilterCategoryDrop,
  IRightSideBarContentsDetails,
} from "../../../../CommonServices/interface";
import SPServices from "../../../../CommonServices/SPServices";
//Style Imports:
import { LuBadgePlus } from "react-icons/lu";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import {
  getSpGroupMembers,
  RightSidebar,
  tabViewBar,
} from "../../../../CommonServices/CommonTemplates";
import { Persona } from "office-ui-fabric-react";
import { IoMdNotificationsOutline } from "react-icons/io";
import "../../../../External/style.css";
import headerStyles from "./Header.module.scss";
import "./HeaderStyle.css";
//Children's component import
import DashboardPage from "../Dashboard/DashboardPage";
import { InputText } from "primereact/inputtext";
import ApprovalConfig from "../ApprovalConfig/ApprovalConfig";

const Header = ({ context, currentPage }) => {
  //UseStates
  const [categoryFilterValue, setCategoryFilterValue] =
    useState<IDropdownDetails>({ ...Config.initialConfigDrop });
  const [selectedCategory, setSelectedCategory] =
    useState<IBasicFilterCategoryDrop>();
  const [sideBarVisible, setSideBarVisible] = useState<boolean>(false);
  const [sideBarcontent, setSideBarContent] = useState<IRightSideBarContents>({
    ...Config.rightSideBarContents,
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const loginUser = context._pageContext._user.email;
  const [activeTabViewBar, setActiveTabViewBar] = useState(0);
  const [globelSearchValue, setGlobelSearchValue] = useState<string>("");
  const userDetails: IUserDetails = {
    name: context._pageContext._user.displayName,
    email: context._pageContext._user.email,
  };
  const [addSideBarContentBooleans, setAddSideBarContentBooleans] =
    useState<IRightSideBarContentsDetails>({
      ...Config.rightSideBarContentsDetails,
    });
  const [activeTabView, setActiveTabView] = useState(0);
  console.log("activeTabView", activeTabView);
  console.log("currentPage", currentPage);

  //Get Category From List
  const categoryFilter = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.CategoryConfig,
      Select: "*",
      Orderby: "Modified",
      Orderbydecorasc: false,
    })
      .then((res: any) => {
        const TempArr: IBasicFilterCategoryDrop[] = [];
        res?.forEach((item: any) => {
          TempArr.push({ name: item.Category, id: item.ID });
        });
        setCategoryFilterValue((prev: IDropdownDetails) => ({
          ...prev,
          categoryDrop: TempArr,
        }));
      })
      .catch((e) => {
        console.log("Get Category Error", e);
      });
  };

  const openSidebar = async () => {
    if (currentPage === Config.sideNavPageNames.Request) {
      setAddSideBarContentBooleans((prev: IRightSideBarContentsDetails) => ({
        ...prev,
        addRequestDetails: true,
      }));
    }
    setSideBarVisible(true);
  };

  //Set TabView Content
  const declareTabViewBar = () => {
    switch (currentPage) {
      case Config.sideNavPageNames.Request:
        const TemptabContent: ITabviewDetails[] = [
          {
            id: 2,
            name: "My Request",
          },
          {
            id: 3,
            name: "My Approval",
          },
        ];

        if (isAdmin) {
          TemptabContent.push({
            id: 1,
            name: "All Request",
          });
        }

        const tempTabView = tabViewBar(
          TemptabContent,
          activeTabViewBar,
          setActiveTabViewBar
        );
        return <>{tempTabView}</>;
      case Config.sideNavPageNames.ApproveConfig:
        const TempApproveConfigTabContent: ITabviewDetails[] = [
          {
            id: 1,
            name: "Category",
          },
          {
            id: 2,
            name: "Approver Workflow",
          },
          {
            id: 3,
            name: "Email Workflow",
          },
        ];

        const tempApproveConfigTabView = tabViewBar(
          TempApproveConfigTabContent,
          activeTabView,
          setActiveTabView
        );
        return <>{tempApproveConfigTabView}</>;
    }
  };

  // Header Filters
  const headerFilters = () => {
    return (
      <>
        {((currentPage === Config.sideNavPageNames.ApproveConfig &&
          activeTabView === 0) ||
          (currentPage === Config.sideNavPageNames.Request &&
            activeTabViewBar === 0)) && (
          <Dropdown
            value={selectedCategory}
            options={categoryFilterValue.categoryDrop}
            onChange={(e) => {
              setSelectedCategory(e.value);
            }}
            showClear
            filter
            optionLabel="name"
            placeholder="Category"
            className="w-full md:w-14rem"
          />
        )}
        {((currentPage === Config.sideNavPageNames.Request &&
          activeTabViewBar === 0) ||
          currentPage === Config.sideNavPageNames.ApproveConfig) && (
          <div className="addNewButton">
            <Button
              label="Add new"
              onClick={async () => {
                openSidebar();
              }}
              icon={<LuBadgePlus />}
            />
          </div>
        )}
        {currentPage === Config.sideNavPageNames.Request &&
          activeTabViewBar !== 0 && (
            <div className={headerStyles.searchFilter}>
              <InputText
                style={{ width: "80%" }}
                type="Search"
                value={globelSearchValue}
                placeholder="Search here..."
                onChange={(e) => setGlobelSearchValue(e.target.value)}
              />
            </div>
          )}
      </>
    );
  };

  //useEffect
  useEffect(() => {
    categoryFilter();
    declareTabViewBar();
    getSpGroupMembers(Config.spGroupNames.RequestsAdmin).then(async (res) => {
      debugger;
      if (res?.some((e) => e?.email === loginUser)) {
        await setIsAdmin(true);
      } else {
        false;
      }
    });
  }, []);
  useEffect(() => {
    setGlobelSearchValue("");
    headerFilters();
  }, [activeTabViewBar, currentPage]);
  useEffect(() => {
    if (!sideBarVisible) {
      setAddSideBarContentBooleans({ ...Config.rightSideBarContentsDetails });
    }
  }, [sideBarVisible]);

  return (
    <>
      <div className="headerContainer">
        <div className={headerStyles.profile_header_container}>
          <div className={headerStyles.profile_header_content}>
            <h1>Welcome back,</h1>
            <label>{userDetails.name}</label>
          </div>
          <div className={headerStyles.profile_header_Icons}>
            <div className={headerStyles.notifyBell}>
              <IoMdNotificationsOutline />
            </div>
            <Persona
              imageUrl={`/_layouts/15/userphoto.aspx?size=S&username=${userDetails.email}`}
            />
          </div>
        </div>

        <div className={headerStyles.filter_header_container}>
          <div className={headerStyles.filter_header_pageName}>
            {declareTabViewBar()}
          </div>
          {headerFilters()}
          <RightSidebar
            visible={sideBarVisible}
            onHide={() => {
              setSideBarVisible(false);
            }}
            contents={
              currentPage == Config.sideNavPageNames.ApproveConfig &&
              activeTabView == 0
                ? sideBarcontent?.categoryConfigContent
                : currentPage == Config.sideNavPageNames.Request
                ? addSideBarContentBooleans?.addRequestDetails
                  ? sideBarcontent?.AddRequestsDashBoardContent
                  : sideBarcontent?.RequestsDashBoardContent
                : currentPage == Config.sideNavPageNames.ApproveConfig &&
                  activeTabView == 1
                ? sideBarcontent?.ApprovalConfigContent
                : currentPage == Config.sideNavPageNames.ApproveConfig &&
                  activeTabView == 2
                ? sideBarcontent?.EmailWorkFlowContent
                : ""
            }
          ></RightSidebar>
        </div>
      </div>

      <div>
        {currentPage == Config.sideNavPageNames.Request ? (
          <>
            <DashboardPage
              categoryFilterValue={categoryFilterValue}
              activeTabViewBar={activeTabViewBar}
              addRequest={addSideBarContentBooleans?.addRequestDetails}
              globelSearchValue={globelSearchValue}
              selectedCategory={selectedCategory}
              sideBarVisible={sideBarVisible}
              context={context}
              setRequestsDashBoardContent={setSideBarContent}
              setDynamicRequestsSideBarVisible={setSideBarVisible}
            />
          </>
        ) : currentPage == Config.sideNavPageNames.ApproveConfig ? (
          <ApprovalConfig
            context={context}
            getCategoryFunction={categoryFilter}
            selectedCategory={selectedCategory}
            ApprovalConfigSideBarVisible={sideBarVisible}
            setTabView={activeTabView}
            setApprovalConfigSideBarContent={setSideBarContent}
            setApprovalConfigSideBarVisible={setSideBarVisible}
          />
        ) : (
          ""
        )}
      </div>
    </>
  );
};

export default Header;
