import { IRilogRequest, IRilogRequestItem, IRilogRequestTimed, IRilogResponse, IRilogResponseTimed } from '../../types';
import { getState, updatePartState } from '../../state';
import { clearLongTimer, clearShortTimer, startShortTimer } from '../../utils/timers';
import { createRequestFilter } from '../../filters';
import { pushRequests } from '../../utils/requests';

const pushRequest = (request: IRilogRequest) => {
    const state = getState();
    console.log('[pushRequest] request ', request, 'state', state);
    // exit if recording is stopped
    if (!state.recording) {
        return;
    }

    const timedRequest: IRilogRequestTimed | null = request
        ? {
              ...request,
              timestamp: Date.now(),
              locationOrigin: window.location?.origin || null,
              locationHref: window.location?.href || null,
              localStorage: JSON.stringify(localStorage),
          }
        : null;

    console.log('[pushRequest] timedRequest ', timedRequest);

    startShortTimer();

    if (timedRequest) {
        let filteredRequest: IRilogRequestTimed | null = null;

        const requestFilter = createRequestFilter(state.config);

        filteredRequest = requestFilter.sensetive(timedRequest);
        filteredRequest = requestFilter.sensetiveData(filteredRequest);
        filteredRequest = requestFilter.headers(filteredRequest);
        filteredRequest = requestFilter.storage(filteredRequest);

        updatePartState({ request: filteredRequest || null });
    }
};

const pushResponse = (response: IRilogResponse) => {
    const state = getState();
    // exit if recording is stopped
    if (!state.recording) {
        return;
    }

    const timedResponse: IRilogResponseTimed | null = response ? { ...response, timestamp: Date.now() } : null;

    console.log('[pushResponse] timedResponse ', timedResponse);

    clearShortTimer();

    if (timedResponse && state.request) {
        const fullRequest: IRilogRequestItem = {
            _id: Date.now().toString(),
            request: state.request,
            response: timedResponse,
        };

        console.log('[pushResponse] fullRequest ', fullRequest);

        clearLongTimer();

        pushRequests(fullRequest);
    } else {
        if (state.request) {
            const fullRequest: IRilogRequestItem = {
                _id: Date.now().toString(),
                request: state.request,
                response: {
                    data: 'No response from server. Timeout.',
                    status: '',
                    timestamp: Date.now(),
                },
            };

            clearLongTimer();

            pushRequests(fullRequest);
        }
    }
};

export { pushRequest, pushResponse };
