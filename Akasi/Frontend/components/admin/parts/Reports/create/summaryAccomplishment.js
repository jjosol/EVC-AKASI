import dayjs from "dayjs";

import getRequest from "./getRequest.js";

export default async function makeAccountability(requestId) {
    const request = await getRequest(requestId);

    const { campus } = request.schoolYear;
    const dateRequested = dayjs(request.createdAt).format("MMMM DD, YYYY");
    const schoolYear = `${request.schoolYear.yearStart}-${request.schoolYear.yearEnd}`;
    const studentName = `${request.requestor.firstName} ${request.requestor.lastName}`;
    const gradeSection = `${request.gradeSection.grade}-${request.gradeSection.section}`;
    // ---- END ----- //

    return html;
}
