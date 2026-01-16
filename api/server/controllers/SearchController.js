import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import SearchService from '../services/search.js';
import { getOffset } from '../utils/helper.js';

class SearchController {
  async search(req, res) {
    try {
      const { search_text, type, page_no = 1, items_per_page = 10 } = req.query;
      if (!search_text) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse({}, 'Search text is required.', httpStatus.BAD_REQUEST));
      }

      const offset = getOffset(+page_no, +items_per_page);
      const response = await SearchService.searchEntities(search_text, type, items_per_page, offset);

      if (response.rows.length > 0) {
        return res
          .status(httpStatus.OK)
          .json(new APIResponse(response, 'Search results fetched successfully', httpStatus.OK));
      } else {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse(response, 'No results found.', httpStatus.NOT_FOUND));
      }
    } catch (error) {
      console.error('Search error:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, 'Failed to fetch search results', httpStatus.INTERNAL_SERVER_ERROR));
    }
  }
   async getPopularSearches(req, res) {
    try {
      const { type, limit = 8 } = req.query;
      
      const response = await SearchService.getPopularSearches(type, parseInt(limit));

      if (response.length > 0) {
        return res
          .status(httpStatus.OK)
          .json(new APIResponse(response, 'Popular searches fetched successfully.', httpStatus.OK));
      } else {
        return res
          .status(httpStatus.OK)
          .json(new APIResponse([], 'No popular searches found.', httpStatus.OK));
      }
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse([], 'Failed to fetch popular searches.', httpStatus.INTERNAL_SERVER_ERROR));
    }
  }
}


export default new SearchController();