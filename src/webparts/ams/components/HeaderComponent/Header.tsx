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
  ICardDetails,
  ICardDataCountDetails,
} from "../../../../CommonServices/interface";
import SPServices from "../../../../CommonServices/SPServices";
//Style Imports:
import { LuBadgePlus } from "react-icons/lu";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import {
  getSpGroupMembers,
  RightSidebar,
  showCard,
  tabViewBar,
} from "../../../../CommonServices/CommonTemplates";
import "../../../../External/style.css";
import headerStyles from "./Header.module.scss";
import "./HeaderStyle.css";
//Children's component import
import DashboardPage from "../Dashboard/DashboardPage";
import { InputText } from "primereact/inputtext";
import ApprovalConfig from "../ApprovalConfig/ApprovalConfig";
//React icons imports:
import { FiClock } from "react-icons/fi";
import { PiNoteDuotone } from "react-icons/pi";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { GoGitPullRequest } from "react-icons/go";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { MdOutlineInsights } from "react-icons/md";

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
  const [currentTableData, setCurrentTableData] = useState([]);
  console.log(currentTableData, "currentTableData");
  const [cardDataCountDetails, setCardDataCountDetails] = useState<
    ICardDataCountDetails[]
  >([Config.cardDataCountDetailsConfig]);

  //Get Category From List
  const categoryFilter = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.CategoryConfig,
      Select: "*",
      Orderby: "Modified",
      Orderbydecorasc: false,
      Filter: [
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
        {
          FilterKey: "IsDraft",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
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

  // Sitebar open
  const openSidebar = async () => {
    if (activeTabViewBar === 0) {
      setAddSideBarContentBooleans((prev: IRightSideBarContentsDetails) => ({
        ...prev,
        addRequestDetails: true,
      }));
    }
    setSideBarVisible(true);
  };

  //Set Card Details Count
  const setCardCounts = async () => {
    const tempTotalRequestCount: number = currentTableData?.length;
    const tempPendingRequestCount: number = currentTableData?.filter(
      (e) => e?.status === "Pending"
    ).length;
    const tempApprovedRequestCount: number = currentTableData?.filter(
      (e) => e?.status === "Approved"
    ).length;
    const tempRejecetedRequestCount: number = currentTableData?.filter(
      (e) => e?.status === "Rejected"
    ).length;
    const tempArr = [
      {
        name: "Total Requests",
        count: tempTotalRequestCount,
        icon: <PiNoteDuotone />,
      },
      {
        name: "Pending",
        count: tempPendingRequestCount,
        icon: <FiClock />,
      },
      {
        name: "Approved",
        count: tempApprovedRequestCount,
        icon: <IoMdCheckmarkCircleOutline />,
      },
      {
        name: "Rejected",
        count: tempRejecetedRequestCount,
        icon: <MdOutlineDoNotDisturbAlt />,
      },
    ];
    await setCardDataCountDetails([...tempArr]);
  };

  //Set TabView Content
  const declareTabViewBar = () => {
    const TemptabContent: ITabviewDetails[] = [
      {
        id: 1,
        name: "My Request",
      },
      {
        id: 2,
        name: "My Approval",
      },
    ];

    if (isAdmin) {
      TemptabContent.push(
        {
          id: 3,
          name: "Category Workflows",
        },
        {
          id: 4,
          name: "Approval Config",
        },
        {
          id: 5,
          name: "Email Config",
        }
      );
    }
    const tempTabView = tabViewBar(
      TemptabContent,
      activeTabViewBar,
      setActiveTabViewBar
    );
    return <>{tempTabView}</>;
  };

  //Workflows tab view bar
  const workFlowsTabViewBar = () => {
    const TempApproveConfigTabContent: ITabviewDetails[] = [
      {
        id: 1,
        name: "Category",
      },
      {
        id: 2,
        name: "Approval Workflow",
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
  };

  // Header Filters
  const headerFilters = () => {
    return (
      <>
        {isAdmin && (
          <div
            onClick={() => {
              setSideBarVisible(true);
              setActiveTabViewBar(2);
            }}
            className="addNewCustomWorkflowButton"
          >
            <div className="addNewCustomWorkflowIcon">
              <GoGitPullRequest />
            </div>
            <span>New category workflow</span>
          </div>
        )}

        <div
          onClick={() => {
            setAddSideBarContentBooleans(
              (prev: IRightSideBarContentsDetails) => ({
                ...prev,
                addRequestDetails: true,
              })
            );
            setSideBarVisible(true);
            setActiveTabViewBar(0);
          }}
          className="addNewCustomWorkflowButton addNewRequestButton"
        >
          <div className="addNewCustomWorkflowIcon">
            <AiOutlinePlusCircle />
          </div>
          <span>New request</span>
        </div>
      </>
    );
  };

  //useEffect
  useEffect(() => {
    categoryFilter();
    declareTabViewBar();
    // workFlowsTabViewBar();
    getSpGroupMembers(Config.spGroupNames.RequestsAdmin).then(async (res) => {
      if (res?.some((e) => e?.email === loginUser)) {
        await setIsAdmin(true);
      } else {
        false;
      }
    });
  }, []);
  useEffect(() => {
    setGlobelSearchValue("");
    setSelectedCategory(undefined);
    headerFilters();
  }, [activeTabViewBar, currentPage]);
  useEffect(() => {
    if (!sideBarVisible) {
      setAddSideBarContentBooleans({ ...Config.rightSideBarContentsDetails });
    }
  }, [sideBarVisible]);
  useEffect(() => {
    setCardCounts();
  }, [currentTableData]);

  return (
    <>
      <div className="headerContainer">
        <div className={headerStyles.profile_header_container}>
          <div className={headerStyles.profile_header_content}>
            <span>Approval Hub</span>
            <p>Manage and track approval workflows across your organization</p>
          </div>
          <div>
            <div className={headerStyles.profile_header_user}>
              <div className={headerStyles.profile_name}>
                Hello {userDetails?.name}
              </div>
              <div className={headerStyles.profile_Image}>
                <img
                  src={`/_layouts/15/userphoto.aspx?size=L&username=${loginUser}`}
                  alt="User profile photo"
                ></img>
              </div>
            </div>
          </div>
        </div>
        {/* {(activeTabViewBar === 1 || activeTabViewBar === 0) && (
          <div className={headerStyles.cardDetails_container}>
            {cardDataCountDetails?.map((e) =>
              showCard({
                cardTitle: e?.name,
                cardContent: e?.count.toString(),
                icon: e?.icon,
              })
            )}
          </div>
        )} */}
        <div className={headerStyles.header_title_container}>
          <span style={{ fontSize: "16px" }}>
            <MdOutlineInsights />
          </span>
          <span
            style={{
              fontSize: "14px",
              fontFamily: "'interSemiBold', sans-serif",
            }}
          >
            More insights
          </span>
        </div>
        <div className={headerStyles.header_container}>
          <div className={headerStyles.cardDetails_container}>
            {cardDataCountDetails?.map((e) =>
              showCard({
                cardTitle: e?.name,
                cardContent: e?.count.toString(),
                icon: e?.icon,
              })
            )}
          </div>
          <div className={headerStyles.profile_header_Icons}>
            {headerFilters()}
          </div>
        </div>

        <div className={headerStyles.filter_header_container}>
          <div className={headerStyles.filter_header_pageName}>
            {declareTabViewBar()}
          </div>

          <RightSidebar
            visible={sideBarVisible}
            onHide={() => {
              setSideBarVisible(false);
            }}
            activeTabViewBar={activeTabViewBar}
            contents={
              activeTabViewBar === 2
                ? sideBarcontent?.categoryConfigContent
                : activeTabViewBar === 0 || activeTabViewBar === 1
                ? addSideBarContentBooleans?.addRequestDetails &&
                  activeTabViewBar === 0
                  ? sideBarcontent?.AddRequestsDashBoardContent
                  : sideBarcontent?.RequestsDashBoardContent
                : activeTabViewBar === 3
                ? sideBarcontent?.ApprovalConfigContent
                : activeTabViewBar === 4
                ? sideBarcontent?.EmailWorkFlowContent
                : ""
            }
          ></RightSidebar>
        </div>
      </div>
      <div>
        {activeTabViewBar === 0 || activeTabViewBar === 1 ? (
          <>
            <DashboardPage
              setCurrentTableDataForDataCard={setCurrentTableData}
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
        ) : activeTabViewBar !== 0 && activeTabViewBar !== 1 ? (
          <ApprovalConfig
            context={context}
            getCategoryFunction={categoryFilter}
            selectedCategory={selectedCategory}
            ApprovalConfigSideBarVisible={sideBarVisible}
            activeTabViewBar={activeTabViewBar}
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
