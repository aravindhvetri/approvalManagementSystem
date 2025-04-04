import * as React from "react";
import { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import customEmailStyles from "./CustomEmail.module.scss";
import { Label } from "office-ui-fabric-react";
import { Config } from "../../../../../../../CommonServices/Config";
import SPServices from "../../../../../../../CommonServices/SPServices";
import { ICategoryEmailConfigDetails } from "../../../../../../../CommonServices/interface";
import { notesContainerDetails } from "../../../../../../../CommonServices/CommonTemplates";

const statusOptions = [
  { label: "Approval", value: "Approval" },
  { label: "Reject", value: "Reject" },
  { label: "ReSubmit", value: "ReSubmit" },
  { label: "ReWork", value: "ReWork" },
];

const CustomEmail = ({
  actionBooleans,
  setCustomEmailTemplateSideBarVisible,
  customEmailData,
  categoryClickingID,
}) => {
  const [templates, setTemplates] = useState<ICategoryEmailConfigDetails[]>([
    Config.CategoryEmailConfigDefault,
  ]);
  //Notes
  const notes = [
    {
      info: "You can able to edit Email templates only on Email Workflow",
    },
  ];
  //Get CategoryEmailConfig
  const getCategoryEmailConfig = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.CategoryEmailConfig,
      Select: "*,Category/Id,ParentTemplate/Id",
      Expand: "ParentTemplate,Category",
      Filter: [
        {
          FilterKey: "CategoryId",
          Operator: "eq",
          FilterValue: categoryClickingID.toString(),
        },
      ],
    })
      .then((res: any) => {
        const tempEmailTemplateArr: ICategoryEmailConfigDetails[] = [];
        res?.forEach(async (element: any) => {
          const tempArr: ICategoryEmailConfigDetails =
            await getEmailTemplateConfig(
              element?.Process,
              element?.ParentTemplateId
            );
          if (tempArr) {
            tempEmailTemplateArr.push({ ...tempArr });
          }
          setTemplates([...tempEmailTemplateArr]);
        });
      })
      .catch((err) => console.log("getCategoryEmailConfig err", err));
  };

  //Get EmailTemplate Config
  const getEmailTemplateConfig = async (status, templateID) => {
    try {
      const res: any = await SPServices.SPReadItemUsingID({
        Listname: Config.ListNames.EmailTemplateConfig,
        SelectedId: templateID,
      });
      return {
        templateName: res?.TemplateName,
        emailBody: res?.EmailBody,
        status: status,
      };
    } catch {
      (err) => console.log("getEmailTemplateConfig err", err);
    }
  };

  const handleChange = (index, key, value) => {
    const newTemplates = [...templates];
    newTemplates[index][key] = value;
    setTemplates(newTemplates);
    customEmailData(newTemplates);
  };

  const handleAdd = () => {
    setTemplates([...templates, Config.CategoryEmailConfigDefault]);
  };

  const handleSubmit = () => {
    templates.forEach((template) => {
      if (template.templateName && template.emailBody) {
        SPServices.SPAddItem({
          Listname: Config.ListNames?.EmailTemplateConfig,
          RequestJSON: template,
        }).catch((err) => console.log("Error in Creating Email Template", err));
      }
    });
    setTemplates([Config.CategoryEmailConfigDefault]);
  };

  //useEffects
  React.useEffect(() => {
    if (categoryClickingID) {
      getCategoryEmailConfig();
    }
  }, [categoryClickingID]);
  return (
    <div>
      {templates.map((template, index) => (
        <div key={index} className={customEmailStyles.templateContainer}>
          <div className={customEmailStyles.fieldsContainer}>
            <div className={customEmailStyles.fieldsContainerChild}>
              <Label className={customEmailStyles.label}>Template Name</Label>
              <InputText
                disabled={actionBooleans?.isView || actionBooleans?.isEdit}
                value={template.templateName}
                onChange={(e) =>
                  handleChange(index, "templateName", e.target.value)
                }
                style={{ width: "38%" }}
                className={customEmailStyles.input}
              />
            </div>
            <div className={customEmailStyles.fieldsContainerChild}>
              <Label className={customEmailStyles.label}>Status</Label>
              <Dropdown
                disabled={actionBooleans?.isView || actionBooleans?.isEdit}
                value={template.status}
                options={statusOptions}
                onChange={(e) => handleChange(index, "status", e.value)}
                placeholder="Select Status"
                style={{ width: "38%" }}
                className={customEmailStyles.dropDown}
              />
            </div>
          </div>
          <div className={`${customEmailStyles.EditorSection} card`}>
            <ReactQuill
              readOnly={actionBooleans?.isView || actionBooleans?.isEdit}
              value={template.emailBody}
              onChange={(value) => handleChange(index, "emailBody", value)}
              style={{ height: "100%" }}
            />
          </div>
        </div>
      ))}
      <div className={customEmailStyles.addbutton}>
        <Button
          visible={!(actionBooleans?.isView || actionBooleans?.isEdit)}
          icon="pi pi-plus"
          label="Add"
          className="customSubmitButton"
          onClick={handleAdd}
        />
      </div>
      {actionBooleans?.isEdit && notesContainerDetails("Notes", notes)}
    </div>
  );
};

export default CustomEmail;
