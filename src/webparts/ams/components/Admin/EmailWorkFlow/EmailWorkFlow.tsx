//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
//Common Services Imports:
import SPServices from "../../../../../CommonServices/SPServices";
import { Config } from "../../../../../CommonServices/Config";
import {
  IActionBooleans,
  IDelModal,
  IEmailTemplateConfigDetails,
  IRightSideBarContents,
} from "../../../../../CommonServices/interface";
import {
  ActionsMenu,
  notesContainerDetails,
  notesContainerDetailsSingleLine,
  toastNotify,
} from "../../../../../CommonServices/CommonTemplates";
//PrimeReact Imports:
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Label } from "office-ui-fabric-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Toast } from "primereact/toast";
import { MdMarkEmailRead } from "react-icons/md";
import { LuBadgePlus } from "react-icons/lu";
import { RiDeleteBinLine } from "react-icons/ri";
//Styles Imports:
import EmailWorkFlowStyles from "./EmailWorkFlow.module.scss";
import "./EmailWorkFlowStyle.css";
import "../../../../../External/style.css";
import Loader from "../../Loader/Loader";
import { Dialog } from "primereact/dialog";

const EmailWorkFlow = ({
  setEmailWorkFlowSideBarContent,
  setEmailWorkFlowSideBarVisible,
}) => {
  const toast = useRef<Toast>(null);
  //State Variables:
  const [getEmailTemplateContent, setEmailTemplateContent] = useState<
    IEmailTemplateConfigDetails[]
  >([]);
  const [delModal, setDelModal] = useState<IDelModal>({
    ...Config.initialdelModal,
  });
  const [actionsBooleans, setActionsBooleans] = useState<IActionBooleans>({
    ...Config.InitialActionsBooleans,
  });
  const [templateData, setTemplateData] = useState<IEmailTemplateConfigDetails>(
    {
      ...Config?.EmailTemplateConfigDetails,
    }
  );
  const [isValidation, setValidation] = useState<boolean>(false);
  const infoNotes = [
    { info: " Enter [$ToPerson] for replace of approver name" },
    { info: " Enter [$Requestor] for replace of Requestor name" },
    { info: " Enter [$RequestID] for replace of RequestID" },
    { info: " Enter [$RequestDetails] for replace of Request entire details" },
    { info: " Enter [$RequestDate] for replace of Request date" },
    { info: " Enter [$Status] for replace of Status" },
    { info: " Enter [$ApprovedBY] for replace of Approved by" },
    { info: " Enter [$RejectedBY] for replace of Rejected by" },
    { info: " Enter [$ApproverComments] for replace of Approver comments" },
  ];
  const [showLoader, setShowLoader] = useState<boolean>(true);
  const [showLoaderEmailWorkFlowSideBar, setShowLoaderEmailWorkFlowSideBar] =
    useState<boolean>(false);
  const [usedCategories, setUsedCategories] = useState([]);
  const warningNote = [
    {
      info: ` This email flow is already used by the following categories: ${usedCategories.join(
        ", "
      )}. Please review them carefully before making any changes`,
    },
  ];

  //Get Email Template Contents:
  const getEmailTemplateContents = async () => {
    setShowLoader(true);
    try {
      const res = await SPServices.SPReadItems({
        Listname: Config.ListNames?.EmailTemplateConfig,
        Orderby: "Modified",
        Orderbydecorasc: false,
        Select: "*",
        Filter: [
          {
            FilterKey: "IsDelete",
            Operator: "eq",
            FilterValue: "false",
          },
        ],
      });

      const emailTemplatesWithCategories = await Promise.all(
        res.map(async (item: any) => {
          const categories = await getCategoryEmailDetails(item?.ID);
          return {
            id: item?.ID,
            templateName: item?.TemplateName,
            emailBody: item?.EmailBody,
            usedCategories: categories,
          };
        })
      );

      setEmailTemplateContent(emailTemplatesWithCategories);
      setShowLoader(false);
    } catch (err) {
      console.log("Error in getEmailTemplateContents", err);
    }
  };

  // Modified getCategoryEmailDetails to return category array
  const getCategoryEmailDetails = async (templateID) => {
    try {
      const res = await SPServices.SPReadItems({
        Listname: Config.ListNames.CategoryEmailConfig,
        Select: "*,Category/Id,ParentTemplate/Id,Category/Category",
        Expand: "Category,ParentTemplate",
        Filter: [
          {
            FilterKey: "ParentTemplateId",
            Operator: "eq",
            FilterValue: templateID.toString(),
          },
        ],
      });

      const tempCategoryArr =
        res?.map((element: any) => element?.Category?.Category) || [];
      setUsedCategories([...tempCategoryArr]);
      return tempCategoryArr;
    } catch (err) {
      console.log("getCategoryEmailDetails err", err);
      return [];
    }
  };

  //Handle Action View and Edit:
  const handleAction = (
    action: string,
    rowData: IEmailTemplateConfigDetails
  ) => {
    const selected = getEmailTemplateContent.find(
      (item) => item?.id === rowData?.id
    );
    if (selected) {
      if (action === "view") {
        setActionsBooleans({ isView: true, isEdit: false });
      } else if (action === "edit") {
        setActionsBooleans({ isView: false, isEdit: true });
      }
      setTemplateData({
        id: selected.id,
        templateName: selected?.templateName || "",
        emailBody: selected?.emailBody || "",
      });
      getCategoryEmailDetails(selected.id);
      setEmailWorkFlowSideBarVisible(true);
    }
  };

  //Handle Delete:
  const handleDelete = () => {
    const json = {
      IsDelete: true,
    };
    SPServices.SPUpdateItem({
      Listname: Config.ListNames?.EmailTemplateConfig,
      ID: delModal.id,
      RequestJSON: json,
    })
      .then(() => {
        getEmailTemplateContents();
        setDelModal({ isOpen: false, id: null });
      })
      .catch((err) => {
        console.log("Error in Deleting Email Template", err);
      });
  };

  //Handle Change in Template Data:
  const handleChange = (key: string, value: string) => {
    setTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  //Submit the Email Template:
  const handleSubmit = () => {
    setShowLoader(true);
    setShowLoaderEmailWorkFlowSideBar(true);
    if (actionsBooleans.isEdit && templateData.id) {
      const json = {
        TemplateName: templateData.templateName,
        EmailBody: templateData.emailBody,
      };
      SPServices.SPUpdateItem({
        Listname: Config.ListNames?.EmailTemplateConfig,
        ID: templateData.id,
        RequestJSON: json,
      })
        .then((res) => {
          getEmailTemplateContents();
          setEmailWorkFlowSideBarVisible(false);
          setActionsBooleans({ ...Config.InitialActionsBooleans });
          setTemplateData({ ...Config?.EmailTemplateConfigDetails });
          setShowLoader(false);
          setShowLoaderEmailWorkFlowSideBar(false);
        })
        .catch((err) => console.log("Error in Updating Email Template", err));
    } else {
      const json = {
        TemplateName: templateData.templateName,
        EmailBody: templateData.emailBody,
      };
      SPServices.SPAddItem({
        Listname: Config.ListNames?.EmailTemplateConfig,
        RequestJSON: json,
      })
        .then((res) => {
          getEmailTemplateContents();
          setEmailWorkFlowSideBarVisible(false);
          setActionsBooleans({ ...Config.InitialActionsBooleans });
          setTemplateData({ ...Config?.EmailTemplateConfigDetails });
          setShowLoader(false);
          setShowLoaderEmailWorkFlowSideBar(false);
        })
        .catch((err) => console.log("Error in Creating Email Template", err));
    }
  };

  //Actions Menu Details:
  const getActionsWithIcons = (rowData: IEmailTemplateConfigDetails) => [
    {
      label: "View",
      icon: "pi pi-eye",
      className: "customView",
      command: () => handleAction("view", rowData),
    },
    {
      label: "Edit",
      className: "customEdit",
      icon: "pi pi-file-edit",
      command: () => handleAction("edit", rowData),
    },
    {
      label: "Delete",
      className: "customDelete",
      icon: "pi pi-trash",
      // command: () => handleDelete(rowData),
      command: () => setDelModal({ isOpen: true, id: rowData?.id }),
    },
  ];

  //check validation:
  // const validateFunction = () => {
  //   let isValidation: boolean =
  //     !templateData?.templateName || !templateData?.emailBody;
  //   setValidation(isValidation);
  //   return !isValidation;
  // };

  const validateFunction = () => {
    let isValidation: boolean = false;
    if (
      templateData?.templateName?.trim() === "" ||
      templateData?.emailBody?.replace(/<p><br><\/p>/gi, "")?.trim() === ""
    ) {
      isValidation = true;
      setValidation(true);
      return false;
    }

    // Check for duplicate name:
    const isDuplicateName = getEmailTemplateContent.some(
      (item) =>
        item?.templateName?.trim().toLowerCase() ===
          templateData?.templateName?.trim().toLowerCase() &&
        item?.id !== templateData?.id
    );

    if (isDuplicateName) {
      toast.current?.show({
        severity: "warn",
        summary: "Warning",
        content: (props) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: "Template name already exists!",
            image: require("../../../../../../src/webparts/ams/assets/giphy.gif"),
          }),
        life: 3000,
      });
      return false;
    }
    setValidation(false);
    return true;
  };

  //Render Category Name:
  const renderCategoryName = (rowData) => {
    return (
      <>
        {rowData?.usedCategories?.length > 0 && (
          <Label className={EmailWorkFlowStyles.categoryLabel}>
            Linked categories for this email:
          </Label>
        )}
        <div className="categoryName">
          {rowData?.usedCategories?.length > 0 && (
            <>
              {rowData.usedCategories.map((e, index) => (
                <div key={index} className="categoryTag">
                  {e}
                </div>
              ))}
            </>
          )}
        </div>
      </>
    );
  };

  //Render Action Column:
  const renderActionColumn = (rowData: IEmailTemplateConfigDetails) => {
    const menuModel = getActionsWithIcons(rowData);
    return <ActionsMenu items={menuModel} />;
  };

  //MainContents Goes to RightSideBar:
  const EmailWorkFlowSideBarContents = () => (
    <>
      {showLoaderEmailWorkFlowSideBar ? <Loader /> : ""}
      <div className="profile_header_content">
        <div>
          <span>{`${
            actionsBooleans.isEdit
              ? "Edit "
              : actionsBooleans.isView
              ? "View "
              : "Add "
          }Email Workflow`}</span>
          <p>
            {actionsBooleans.isEdit
              ? "Modify the Email Workflow for category requests "
              : actionsBooleans.isView
              ? "View the Email Workflow for category requests "
              : "Set up a new Email Workflow for category requests "}
          </p>
        </div>
      </div>
      <div className={EmailWorkFlowStyles.emailMainContainer}>
        {actionsBooleans.isEdit && usedCategories.length > 0 && (
          <>{notesContainerDetailsSingleLine("Warning", warningNote)}</>
        )}
        <div>
          <Label className={EmailWorkFlowStyles.label}>
            Template Name<span className="required">* </span>
            <span className="categoryNameTag">
              Template Name is considered as subject of the email
            </span>
          </Label>
          <InputText
            value={templateData?.templateName}
            placeholder={`Example: Approval/Rejection notification for request`}
            onChange={(e) => handleChange("templateName", e.target.value)}
            disabled={actionsBooleans.isView}
            style={{ width: "38%" }}
            className="inputField"
          />
          <div>
            {isValidation && templateData?.templateName?.trim() === "" && (
              <span className="errorMsg">Template Name is required</span>
            )}
          </div>

          <div className={`${EmailWorkFlowStyles.EditorSection} card`}>
            <Label className={EmailWorkFlowStyles.label}>
              Body content<span className="required">* </span>
              {!templateData?.id && (
                <span className="categoryNameTag">
                  Please adjust the sample content below as needed
                </span>
              )}
            </Label>
            <ReactQuill
              value={templateData?.emailBody}
              onChange={(e) => handleChange("emailBody", e)}
              style={{ height: "100%" }}
              readOnly={actionsBooleans.isView}
            />
            {/* <Editor
            value={templateData?.emailBody}
            onTextChange={(e) => handleChange("emailBody", e.htmlValue)}
            style={{ height: "320px" }}
            readOnly={actionsBooleans.isView}
          /> */}
            <div>
              {isValidation &&
                templateData?.emailBody
                  ?.replace(/<p><br><\/p>/gi, "")
                  ?.trim() === "" && (
                  <span className="errorMsg">Body content is required</span>
                )}
            </div>
          </div>
        </div>
        <div style={{ marginTop: "20px" }}>
          {!actionsBooleans.isView && (
            <>{notesContainerDetails("Info", infoNotes)}</>
          )}
        </div>
      </div>
      <div className={EmailWorkFlowStyles.EmailWorkFlowSideBarButtons}>
        {actionsBooleans.isView && (
          <Button
            icon="pi pi-times"
            label="Close"
            className="customCancelButton"
            onClick={() => {
              setEmailWorkFlowSideBarVisible(false);
              setActionsBooleans({ ...Config.InitialActionsBooleans });
              setTemplateData({ ...Config?.EmailTemplateConfigDetails });
              setValidation(false);
            }}
          />
        )}
        {!actionsBooleans.isView && (
          <>
            <Button
              icon="pi pi-times"
              label="Cancel"
              className="customCancelButton"
              onClick={() => {
                setEmailWorkFlowSideBarVisible(false);
                setActionsBooleans({ ...Config.InitialActionsBooleans });
                setTemplateData({ ...Config?.EmailTemplateConfigDetails });
                setValidation(false);
              }}
            />
            <Button
              icon="pi pi-save"
              label="Submit"
              className="customSubmitButton"
              onClick={() => {
                if (validateFunction()) {
                  handleSubmit();
                }
              }}
            />
          </>
        )}
      </div>
    </>
  );

  useEffect(() => {
    getEmailTemplateContents();
  }, []);
  useEffect(() => {
    if (!setEmailWorkFlowSideBarVisible) {
      setTemplateData({ ...Config?.EmailTemplateConfigDetails });
    }
  }, [setEmailWorkFlowSideBarVisible]);
  useEffect(() => {
    setEmailWorkFlowSideBarContent((prev: IRightSideBarContents) => ({
      ...prev,
      EmailWorkFlowContent: EmailWorkFlowSideBarContents(),
    }));
  }, [actionsBooleans, templateData, isValidation, usedCategories]);

  return (
    <>
      <Toast ref={toast} />
      {showLoader ? (
        <Loader />
      ) : (
        <>
          {/* <div className="customDataTableContainer">
            <DataTable
              paginator
              rows={5}
              value={getEmailTemplateContent}
              tableStyle={{ minWidth: "50rem" }}
              emptyMessage={
                <p style={{ textAlign: "center" }}>No Records Found</p>
              }
            >
              <Column
                style={{ width: "80%" }}
                field="templateName"
                header="Template Name"
              ></Column>
              <Column
                style={{ width: "20%" }}
                field="Action"
                body={renderActionColumn}
              ></Column>
            </DataTable>
          </div> */}
          <div className="customDataTableCardContainer">
            <div
              style={{
                borderBottom: "none",
                paddingBottom: "0px",
                marginBottom: "25px",
              }}
              className="profile_header_content"
            >
              <div>
                <span>Email config</span>
                <p>
                  Set up and manage email templates used in the request and
                  approval process
                </p>
              </div>
              <div className="addNewButton">
                <Button
                  label="Add New"
                  onClick={async () => {
                    setEmailWorkFlowSideBarVisible(true);
                  }}
                  icon={<LuBadgePlus />}
                />
              </div>
            </div>
            <div className="allRecords">
              <span style={{ fontFamily: "interSemiBold" }}>All templates</span>
            </div>
            <div className="dashboardDataTable">
              <DataTable
                value={getEmailTemplateContent}
                paginator
                rows={3}
                className="custom-card-table"
                emptyMessage={
                  <p className="NoDatas" style={{ textAlign: "center" }}>
                    No Records Found
                  </p>
                }
              >
                <Column
                  body={(rowData) => (
                    <div className="requestCard">
                      <div className="requestCardHeader">
                        <div
                          style={{ paddingBottom: "4px" }}
                          className="requestId"
                        >
                          <h3 className="requestIdTitle">
                            <MdMarkEmailRead style={{ fontSize: "18px" }} />
                            {rowData.templateName}
                          </h3>
                        </div>
                        {renderCategoryName(rowData)}
                      </div>
                      <div className="requestCardBody">
                        {renderActionColumn(rowData)}
                      </div>
                    </div>
                  )}
                />
              </DataTable>
            </div>
          </div>
        </>
      )}
      <Dialog
        className="modal-template confirmation"
        draggable={false}
        blockScroll={false}
        resizable={false}
        visible={delModal.isOpen}
        style={{ width: "20rem" }}
        onHide={() => {
          setDelModal({ isOpen: false, id: null });
        }}
      >
        <div className="modal-container">
          <div className="modalIconContainer">
            <RiDeleteBinLine />
          </div>
          <div className="modal-content">
            <div>
              <div className="modal-header">
                <h4>Confirmation</h4>
              </div>
              <p>Are you sure, you want to delete this email template?</p>
            </div>
          </div>
          <div className="modal-btn-section">
            <Button
              label="No"
              className={`cancel-btn`}
              onClick={() => {
                setDelModal({ isOpen: false, id: null });
              }}
            />
            <Button
              className={`submit-btn`}
              label="Yes"
              onClick={() => handleDelete()}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default EmailWorkFlow;
