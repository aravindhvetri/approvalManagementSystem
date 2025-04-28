//Default Imports:
import * as React from "react";
import { useEffect, useState } from "react";
import { sp } from "@pnp/sp";
//PrimeReact Imports:
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { GiCancel } from "react-icons/gi";
//CommonService Imports:
import { Config } from "../../../../CommonServices/Config";
//Styles Imports:
import attachmentStyles from "./AttachmentUploader.module.scss";
import "../../../../External/style.css";

const AttachmentUploader = ({ context, datas }) => {
  const serverRelativeUrl = context?._pageContext?._site?.serverRelativeUrl;
  const [files, setFiles] = useState([]);

  const UploadLibrary = async () => {
    try {
      const folderPath = `${serverRelativeUrl}/${Config.LibraryNames?.AttachmentsLibrary}/Requestors`;
      const requestId = "REQ-001";

      for (const file of files) {
        const fileBuffer = await file.arrayBuffer();
        const uploadResult = await sp.web
          .getFolderByServerRelativeUrl(folderPath)
          .files.add(file.name, fileBuffer, true);

        await uploadResult.file.listItemAllFields.get().then(async (item) => {
          await sp.web.lists
            .getByTitle(Config.LibraryNames?.AttachmentsLibrary)
            .items.getById(item.Id)
            .update({
              RequestID: requestId,
            });
        });
      }

      setFiles([]);
      console.log("All files uploaded successfully!");
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const removeFile = (fileName: string) => {
    const updatedFiles = files.filter((file) => file.name !== fileName);
    setFiles(updatedFiles);
  };

  useEffect(() => {
    if (datas?.requestID) {
      console.log(datas, "datas in useEffect");
    }
  }, [datas]);

  return (
    <>
      <div>
        <FileUpload
          className="addNewButton"
          name="demo[]"
          mode="basic"
          onSelect={(e) => setFiles([...files, ...e.files])}
          url="/api/upload"
          auto
          multiple
          maxFileSize={1000000}
          style={{ width: "14%" }}
          chooseLabel="Browse"
          chooseOptions={{ icon: "" }}
        />
      </div>

      <div style={{ marginTop: "20px" }}>
        {files.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {files.map((file, index) => (
              <li className={attachmentStyles?.fileList} key={index}>
                <Tag
                  className={attachmentStyles.filNameTag}
                  value={file.name}
                />
                <GiCancel
                  style={{ cursor: "pointer", color: "red" }}
                  onClick={() => removeFile(file.name)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* <div style={{ marginTop: "20px" }}>
        <Button onClick={UploadLibrary}>Submit</Button>
      </div> */}
    </>
  );
};

export default AttachmentUploader;
