import * as React from "react";
import { useState, useEffect } from "react";
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
  { label: "Submit", value: "Submit" },
];

const CustomEmail = ({
  actionBooleans,
  setCustomEmailTemplateSideBarVisible,
  customEmailData,
  categoryClickingID,
  customEmailDataWithEmpty,
}) => {
  const [templates, setTemplates] = useState<ICategoryEmailConfigDetails[]>([
    Config.CategoryEmailConfigDefault,
  ]);
  console.log(templates, "templates");
  const [errors, setErrors] = useState<
    { templateName?: string; status?: string; emailBody?: string }[]
  >([]);

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
    if (actionBooleans?.isView == false && actionBooleans?.isEdit == false) {
      const newTemplates = templates.map((t, i) =>
        i === index ? { ...t, [key]: value } : t
      );
      setTemplates(newTemplates);
      customEmailData(newTemplates);
      sessionStorage.setItem("customTemplates", JSON.stringify(newTemplates));

      // Clear errors on valid input
      const newErrors = [...errors];
      if (newErrors[index]) {
        newErrors[index][key] = value ? "" : `This field is required`;
        setErrors(newErrors);
      }
    }
  };

  const handleAdd = () => {
    const lastTemplate = templates[templates.length - 1];
    const newErrors = {
      templateName: !lastTemplate.templateName
        ? "Template name is required"
        : "",
      status: !lastTemplate.status ? "Status is required" : "",
      emailBody: !lastTemplate.emailBody ? "Email body is required" : "",
    };

    if (newErrors.templateName || newErrors.status || newErrors.emailBody) {
      const updatedErrors = [...errors];
      updatedErrors[templates.length - 1] = newErrors;
      setErrors(updatedErrors);
      return;
    }

    setTemplates([...templates, Config.CategoryEmailConfigDefault]);
    setErrors([...errors, {}]);
  };

  //useEffects
  useEffect(() => {
    const storedTemplates = sessionStorage.getItem("customTemplates");
    if (storedTemplates) {
      const parsedTemplates = JSON.parse(storedTemplates);
      setTemplates(parsedTemplates);
    } else if (categoryClickingID) {
      getCategoryEmailConfig();
    }
  }, [categoryClickingID]);

  useEffect(() => {
    if (actionBooleans?.isView == false && actionBooleans?.isEdit == false) {
      customEmailDataWithEmpty(templates);
    }
  }, [templates]);
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
              {errors[index]?.templateName && (
                <span className="errorMsg">{errors[index].templateName}</span>
              )}
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
              {errors[index]?.status && (
                <span className="errorMsg">{errors[index].status}</span>
              )}
            </div>
          </div>
          <div className={`${customEmailStyles.EditorSection} card`}>
            <ReactQuill
              readOnly={actionBooleans?.isView || actionBooleans?.isEdit}
              value={template.emailBody}
              onChange={(value) => handleChange(index, "emailBody", value)}
              style={{ height: "100%" }}
            />
            {errors[index]?.emailBody && (
              <span className="errorMsg">{errors[index].emailBody}</span>
            )}
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
