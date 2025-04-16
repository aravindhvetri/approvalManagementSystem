//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
//Common Services Imports:
import SPServices from "../../../../../CommonServices/SPServices";
import { Config } from "../../../../../CommonServices/Config";
import {
  IActionBooleans,
  IEmailTemplateConfigDetails,
  IRightSideBarContents,
} from "../../../../../CommonServices/interface";
import {
  ActionsMenu,
  notesContainerDetails,
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
//Styles Imports:
import EmailWorkFlowStyles from "./EmailWorkFlow.module.scss";
import "./EmailWorkFlowStyle.css";
import "../../../../../External/style.css";
import Loader from "../../Loader/Loader";

const EmailWorkFlow = ({
  setEmailWorkFlowSideBarContent,
  setEmailWorkFlowSideBarVisible,
}) => {
  const toast = useRef<Toast>(null);
  //State Variables:
  const [getEmailTemplateContent, setEmailTemplateContent] = useState<
    IEmailTemplateConfigDetails[]
  >([]);
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

  //Get Email Template Contents:
  const getEmailTemplateContents = () => {
    SPServices.SPReadItems({
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
    })
      .then((res: any) => {
        const tempEmailTemplateContentsArr = res.map((item: any) => ({
          id: item?.ID,
          templateName: item?.TemplateName,
          emailBody: item?.EmailBody,
        }));
        setEmailTemplateContent(tempEmailTemplateContentsArr);
        setShowLoader(false);
      })
      .catch((err) => console.log("Error in getEmailTemplateContents", err));
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
      setEmailWorkFlowSideBarVisible(true);
    }
  };

  //Handle Delete:
  const handleDelete = (rowData: IEmailTemplateConfigDetails) => {
    const json = {
      IsDelete: true,
    };
    SPServices.SPUpdateItem({
      Listname: Config.ListNames?.EmailTemplateConfig,
      ID: rowData.id,
      RequestJSON: json,
    })
      .then(() => {
        getEmailTemplateContents();
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
      command: () => handleDelete(rowData),
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
    if (!templateData?.templateName || !templateData?.emailBody) {
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
          }),
        life: 3000,
      });
      return false;
    }
    setValidation(false);
    return true;
  };

  //Render Action Column:
  const renderActionColumn = (rowData: IEmailTemplateConfigDetails) => {
    const menuModel = getActionsWithIcons(rowData);
    return <ActionsMenu items={menuModel} />;
  };

  //MainContents Goes to RightSideBar:
  const EmailWorkFlowSideBarContents = () => (
    <>
      <h4 className={EmailWorkFlowStyles.EmailWorkFlowSideBarHeading}>
        {actionsBooleans.isEdit
          ? "Edit email template"
          : actionsBooleans.isView
          ? "View email template"
          : "Add email template"}
      </h4>
      <div>
        <Label className={EmailWorkFlowStyles.label}>Name</Label>
        <InputText
          value={templateData?.templateName}
          onChange={(e) => handleChange("templateName", e.target.value)}
          disabled={actionsBooleans.isView}
          style={{ width: "38%" }}
        />
        <div>
          {isValidation && !templateData?.templateName && (
            <span className="errorMsg">Name is required</span>
          )}
        </div>
        <div className={`${EmailWorkFlowStyles.EditorSection} card`}>
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
            {isValidation && !templateData?.emailBody && (
              <span className="errorMsg">EmailBody is required</span>
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
        {!actionsBooleans.isView && (
          <>{notesContainerDetails("Info notes", infoNotes)}</>
        )}
      </div>
    </>
  );

  useEffect(() => {
    getEmailTemplateContents();
  }, []);

  useEffect(() => {
    setEmailWorkFlowSideBarContent((prev: IRightSideBarContents) => ({
      ...prev,
      EmailWorkFlowContent: EmailWorkFlowSideBarContents(),
    }));
  }, [actionsBooleans, templateData, isValidation]);

  return (
    <>
      <Toast ref={toast} />
      {showLoader ? (
        <Loader />
      ) : (
        <div className="customDataTableContainer">
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
        </div>
      )}
    </>
  );
};

export default EmailWorkFlow;
