// export default ExistingEmail;
import * as React from "react";
import { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import SPServices from "../../../../../../../CommonServices/SPServices";
import { Config } from "../../../../../../../CommonServices/Config";
import ExistingEmailstyles from "./ExisitingEmail.module.scss";
import { Label } from "office-ui-fabric-react";
import { IFinalSubmitDetails } from "../../../../../../../CommonServices/interface";

const ExistingEmail = ({ ExisitingEmailData }) => {
  //State Variables:
  const [getTemplateNameOptions, setTemplateNameOptions] = useState([]);
  const [selectedDropValues, setSelectedDropValues] = useState<any>([]);
  const [templateData, setTemplateData] = useState([]);

  const getEmailTemplateConfigDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames?.EmailTemplateConfig,
      Orderby: "Modified",
      Orderbydecorasc: false,
      Select: "*",
      Filter: [{ FilterKey: "IsDelete", Operator: "eq", FilterValue: "false" }],
    }).then((res) => {
      const uniqueTemplates = res
        .map((item: any) => ({
          label: item?.TemplateName,
          value: item?.TemplateName,
          id: item?.ID,
        }))
        .filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.value === item.value)
        );

      setTemplateNameOptions(uniqueTemplates);
      setTemplateData(res);
    });
  };

  // Handle dropdown change
  const handleFlowChange = (process: string, value: string) => {
    const selectedTemplate = templateData.find(
      (item) => item.TemplateName === value
    );
    const updatedValues = selectedDropValues.map((item) =>
      item.process === process
        ? { ...item, value, id: selectedTemplate?.ID }
        : item
    );
    setSelectedDropValues(updatedValues);
    ExisitingEmailData(updatedValues);
    sessionStorage.setItem("selectedDropValues", JSON.stringify(updatedValues));
  };

  // Fetch email templates
  useEffect(() => {
    const storedValues = sessionStorage.getItem("selectedDropValues");
    if (storedValues) {
      setSelectedDropValues(JSON.parse(storedValues));
    } else {
      setSelectedDropValues([
        { process: "Approval", value: "", id: null },
        { process: "Reject", value: "", id: null },
        { process: "ReSubmit", value: "", id: null },
        { process: "Submit", value: "", id: null },
      ]);
    }
    getEmailTemplateConfigDetails();

    const handleBeforeUnload = () => {
      sessionStorage.clear();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className={ExistingEmailstyles.existingEmailContainer}>
      {selectedDropValues.map((item: any) => (
        <div key={item.process} className={ExistingEmailstyles.emailRow}>
          <Label className={ExistingEmailstyles.label}>{item.process}</Label>
          <div className={ExistingEmailstyles.dropDownContainer}>
            <Dropdown
              value={item.value || null}
              options={getTemplateNameOptions}
              onChange={(e) => handleFlowChange(item.process, e.value)}
              placeholder="Enter here"
              className={ExistingEmailstyles.dropDown}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExistingEmail;
