//Default Imports:
import * as React from "react";
import { useRef } from "react";
//PeoplePicker Imports;
import {
  IPeoplePickerDetails,
  IToaster,
  ITabviewDetails,
  ICardDetails,
} from "./interface";
import {
  DirectionalHint,
  Label,
  Persona,
  PersonaPresence,
  PersonaSize,
  TooltipDelay,
  TooltipHost,
} from "@fluentui/react";
//React Icons Imports - Using Status Template Only :
import { FaRegCheckCircle } from "react-icons/fa";
import { FaRegTimesCircle } from "react-icons/fa";
import { LuClock9 } from "react-icons/lu";
//PrimeReact Imports:
import { Menu } from "primereact/menu";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { TabView, TabPanel } from "primereact/tabview";
//Common Style Imports:
import styles from "../External/commonStyles.module.scss";
import "../External/style.css";
import { sp } from "@pnp/sp/presets/all";
import { Card } from "primereact/card";

//PeoplePicker Template:
export const peoplePickerTemplate = (user: IPeoplePickerDetails) => {
  return (
    <>
      {user && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <Persona
            styles={{
              root: {
                margin: "0 !important;",
                ".ms-Persona-details": {
                  display: "none",
                },
              },
            }}
            imageUrl={
              "/_layouts/15/userphoto.aspx?size=S&username=" + user?.email
            }
            title={user?.name}
            size={PersonaSize.size24}
          />
          <p
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              margin: 0,
            }}
            className="displayText"
            title={user?.name}
          >
            {user?.name}
          </p>
        </div>
      )}
    </>
  );
};

//Custom Template :
export const statusTemplate = (status: string) => {
  return (
    <div
      className={styles.statusItem}
      style={{
        backgroundColor: getColors(status)?.bgColor,
        color: getColors(status)?.color,
        borderColor: getColors(status)?.borderColor,
      }}
    >
      <div
        style={{
          fontSize: "16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {getIcons(status)}
      </div>
      <div>{status}</div>
    </div>
  );
};

//Custom Template for Card View:
export const cardStatusTemplate = (status: string) => {
  return (
    <div
      className={styles.cardStatusItem}
      style={{
        backgroundColor: getColors(status)?.bgColor,
        color: getColors(status)?.color,
        borderColor: getColors(status)?.borderColor,
      }}
    >
      <div
        style={{
          fontSize: "12px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {getIcons(status)}
      </div>
      <div>{status}</div>
    </div>
  );
};

const getIcons = (status: string) => {
  switch (status) {
    case "Pending":
      return <LuClock9 />;

    case "Approved":
      return <FaRegCheckCircle />;

    case "Rejected":
      return <FaRegTimesCircle />;
    case "Restart from first stage":
      return "";
    case "Restart from rejected stage":
      return "";
    case "Resubmission not allowed":
      return "";
    case "Everyone should approve":
      return "";
    case "Anyone can approve":
      return "";
    case "Active":
      return <FaRegCheckCircle />;
    case "Draft":
      return <LuClock9 />;
    default:
      return null;
  }
};

const getColors = (status: string) => {
  let colors = {
    bgColor: "",
    color: "",
    borderColor: "",
  };
  switch (status) {
    case "Pending":
      colors.bgColor = "#eaf1f6";
      colors.color = "#2a6d9c";
      break;
    case "Approved":
      colors.bgColor = "#e8f6ed";
      colors.color = "#16a34a";
      break;
    case "Rejected":
      colors.bgColor = "#f6e8e8";
      colors.color = "#b23d3f";
      break;
    case "Restart from rejected stage":
      colors.bgColor = "#eaf1f6";
      colors.color = "#2a6d9c";
      break;
    case "Restart from first stage":
      colors.bgColor = "#e8f6ed";
      colors.color = "#16a34a";
      break;
    case "Resubmission not allowed":
      colors.bgColor = "#f6e8e8";
      colors.color = "#b23d3f";
      break;
    case "Everyone should approve":
      colors.bgColor = "#f6e8e8";
      colors.color = "#b23d3f";
      break;
    case "Anyone can approve":
      colors.bgColor = "#e8f6ed";
      colors.color = "#16a34a";
      break;
    case "Draft":
      colors.bgColor = "#eaf1f6";
      colors.color = "#2a6d9c";
      break;
    case "Active":
      colors.bgColor = "#e8f6ed";
      colors.color = "#16a34a";
      break;
    default:
      return null;
  }
  return colors;
};

//View,Edit,Delete Menu:
export const ActionsMenu = ({ items }) => {
  const menuLeft = useRef(null);
  return (
    <div className="customActionMenu">
      <Menu
        model={items}
        popup
        ref={menuLeft}
        id="popup_menu_left"
        style={{ width: "8.5rem", padding: "0px" }}
      />
      <Button
        icon="pi pi-ellipsis-v"
        className="mr-2"
        onClick={(event) => {
          menuLeft.current.toggle(event);
        }}
        aria-controls="popup_menu_left"
        aria-haspopup
      />
    </div>
  );
};

//Custom Header for Sidebar:
export const customHeader = (title, description) => (
  <div className="profile_header_content">
    <div>
      <h1
        style={{
          fontSize: "1.875rem",
          lineHeight: "2.25rem",
        }}
      >
        {title}
      </h1>
      <p>{description}</p>
    </div>
  </div>
);

//SideBar setups:
export const RightSidebar = ({
  visible,
  onHide,
  activeTabViewBar,
  contents,
}) => {
  return (
    <div>
      <Sidebar
        visible={visible}
        className="CustomSideBarContainer"
        position="right"
        header={
          activeTabViewBar == 2
            ? customHeader(
                "Purchase Workflow",
                "Configure your purchase approval process"
              )
            : activeTabViewBar == 3
            ? customHeader(
                "Approval Workflow",
                "Configure your approval workflow for the approval process"
              )
            : activeTabViewBar == 4
            ? customHeader(
                "Email Workflow",
                "Configure your email workflow for the notification process"
              )
            : activeTabViewBar == 0
            ? customHeader(
                "Request Details",
                "Configure your request for the approval"
              )
            : activeTabViewBar == 1
            ? customHeader(
                "Approval Summary",
                "Track the status of all your assigned requests in one place"
              )
            : ""
        }
        onHide={onHide}
      >
        {contents}
      </Sidebar>
    </div>
  );
};

//Common Toast Notification setups:
export const toastNotify = (item: IToaster) => {
  return (
    <div className="flex flex-row align-items-center toastContainer">
      <div className={item.ClsName}>
        {
          <>
            {item.image ? (
              <img
                src={item.image}
                alt="toast icon"
                style={{ width: 40, height: 40 }}
              />
            ) : (
              <i className={`pi ${item.iconName}`}></i>
            )}
          </>
        }
      </div>
      <div>
        <div className="toast-heading">{item.type}</div>
        <div className="toast-message">{item.msg}</div>
      </div>
    </div>
  );
};

//MultiPeoplePicker Template:
export const multiplePeoplePickerTemplate = (users: IPeoplePickerDetails[]) => {
  return (
    <>
      {users?.length ? (
        <div
          className="user-selector-group"
          style={{
            display: "flex",
          }}
        >
          {users.map((value, index) => {
            if (index < 2) {
              return (
                <Persona
                  styles={{
                    root: {
                      cursor: "pointer",
                      margin: "0 !important;",
                      ".ms-Persona-details": {
                        display: "none",
                      },
                    },
                  }}
                  imageUrl={
                    "/_layouts/15/userphoto.aspx?size=S&username=" + value.email
                  }
                  title={value.name}
                  size={PersonaSize.size32}
                />
              );
            }
          })}

          {users.filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.email === item.email)
          ).length > 2 ? (
            <TooltipHost
              className="all-member-users"
              content={
                <ul style={{ margin: 10, padding: 0 }}>
                  {users
                    .filter(
                      (item, index, self) =>
                        index === self.findIndex((t) => t.email === item.email)
                    )
                    .map((DName: any) => {
                      return (
                        <li style={{ listStyleType: "none" }}>
                          <div style={{ display: "flex" }}>
                            <Persona
                              showOverflowTooltip
                              size={PersonaSize.size24}
                              presence={PersonaPresence.none}
                              showInitialsUntilImageLoads={true}
                              imageUrl={
                                "/_layouts/15/userphoto.aspx?size=S&username=" +
                                `${DName.email}`
                              }
                            />
                            <Label style={{ marginLeft: 10, fontSize: 12 }}>
                              {DName.name}
                            </Label>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              }
              delay={TooltipDelay.zero}
              directionalHint={DirectionalHint.bottomCenter}
              styles={{ root: { display: "inline-block" } }}
            >
              <div className={styles.Persona}>
                +
                {users.filter(
                  (item, index, self) =>
                    index === self.findIndex((t) => t.email === item.email)
                ).length - 2}
                <div className={styles.AllPersona}></div>
              </div>
            </TooltipHost>
          ) : null}
        </div>
      ) : (
        ""
      )}
    </>
  );
};

//TabView
export const tabViewBar = (
  data: ITabviewDetails[],
  activeTabViewBar: number,
  setActiveTabViewBar: any
) => {
  return (
    <TabView
      activeIndex={activeTabViewBar}
      onTabChange={(e) => {
        setActiveTabViewBar(e.index);
      }}
    >
      {data.map((e) => (
        <TabPanel header={e.name} />
      ))}
    </TabView>
  );
};

//Request ID
export const generateRequestID = (value, count, char) => {
  return value.toString().padStart(count, char);
};

//Notes Container
export const notesContainerDetails = (header, data) => {
  return (
    <div className="notesContainer">
      <h1>{header}</h1>
      <ul>
        {data.map((e: any) => {
          return <li> {e?.info}</li>;
        })}
      </ul>
    </div>
  );
};

//DynamicSectionWithFieldsDropDown Options:
export const columnTypes = [
  { name: "Single line of text", value: "text" },
  { name: "Multiple lines of text", value: "textarea" },
  { name: "Choice", value: "Choice" },
  { name: "Number", value: "Number" },
  { name: "Date", value: "Date" },
  { name: "Date and Time", value: "DateTime" },
  { name: "Person Single", value: "Person" },
  { name: "Person Multi", value: "PersonMulti" },
  { name: "Yes or No", value: "YesorNo" },
];

//StageTemplate :
export const stageBodyTemplate = (rowData) => {
  const sortedStages = [...rowData.stages].sort();
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {sortedStages.map((stage, index) => (
        <span
          key={index}
          style={{
            // padding: "5px",
            // border: "1px solid",
            // borderRadius: "20px",
            // color: getColor(stage),
            // borderColor: getColor(stage),
            padding: "2px 6px 2px 6px",
            borderRadius: "2px",
            color: "white",
            backgroundColor: "#000000b0",
          }}
        >
          {stage}
        </span>
      ))}
    </div>
  );
};

//SetStageColors:
const getColor = (stage: string) => {
  const colors = {
    "Stage 1": "#B98B00",
    "Stage 2": "#C21892",
    "Stage 3": "#2196F3",
    "Stage 4": "#512DA8",
  };
  return colors[stage] || "#000";
};

//Sent email notification
export const sendNotification = async (emailProps: any): Promise<any> => {
  try {
    await sp.utility
      .sendEmail(emailProps)
      .then((res: any) => {})
      .catch((err: any) => {
        console.log("mail err", err);
      });
  } catch (error) {
    console.log("Error fetching access token:", error);
  }
};

//Get SP Group Members
export const getSpGroupMembers = async (groupName) => {
  try {
    const res = await sp.web.siteGroups.getByName(groupName).users.get();
    const groupMembers: IPeoplePickerDetails[] = [];
    res?.forEach((user) => {
      groupMembers.push({
        id: user?.Id,
        name: user?.Title,
        email: user?.Email,
      });
    });
    return groupMembers;
  } catch {
    (err) => console.log("getSpGroupMembers err", err);
  }
};

//Show Card with details
export const showCard = (cardDetails: ICardDetails) => {
  return (
    <Card className="custom-card">
      <div className={styles.cardHeader}>
        <span className="card-title">{cardDetails?.cardTitle}</span>
        <span className={styles.cardIcon}>{cardDetails?.icon}</span>
      </div>
      <div className={styles.cardCount}>{cardDetails?.cardContent}</div>
    </Card>
  );
};
