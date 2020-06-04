import { drive_v3 } from 'googleapis';

const retrieveAllFilesInFolder = async (drive: drive_v3.Drive) => {
  // TODO

  drive.files.list({
    q: `'${drive}'`,
  });

  // return new Promise((resolve, reject) => {
  //   const retrievePageOfChildren = (request, result) => {
  //     request.execute((resp) => {
  //       result = result.concat(resp.items);
  //       const nextPageToken = resp.nextPageToken;
  //       if (nextPageToken) {
  //         request = gapi.client.drive.children.list({
  //           folderId,
  //           pageToken: nextPageToken,
  //         });
  //         retrievePageOfChildren(request, result);
  //       } else {
  //         resolve(result);
  //       }
  //     });
  //   };
  //   const initialRequest = gapi.client.drive.children.list({
  //     folderId,
  //   });
  //   retrievePageOfChildren(initialRequest, []);
  // });
};
