//Default Imports:
import * as React from "react";
import { useRef } from "react";
//PeoplePicker Imports;
import { IPeoplePickerDetails, IToaster, ITabviewDetails } from "./interface";
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
      <div style={{ fontSize: "16px" }}>{getIcons(status)}</div>
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
      colors.color = "##2a6d9c";
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
      colors.color = "##2a6d9c";
      break;
    case "Restart from first stage":
      colors.bgColor = "#e8f6ed";
      colors.color = "#16a34a";
      break;
    case "Resubmission not allowed":
      colors.bgColor = "#f6e8e8";
      colors.color = "#b23d3f";
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
        style={{ width: "8.5rem" }}
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

//SideBar setups:
export const RightSidebar = ({ visible, onHide, contents }) => {
  return (
    <div>
      <Sidebar
        visible={visible}
        className="CustomSideBarContainer"
        position="right"
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
        <i className={`pi ${item.iconName}`}></i>
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

          {users.length > 2 ? (
            <TooltipHost
              className="all-member-users"
              content={
                <ul style={{ margin: 10, padding: 0 }}>
                  {users.map((DName: any) => {
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
                +{users.length - 2}
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
      onTabChange={(e) => setActiveTabViewBar(e.index)}
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
