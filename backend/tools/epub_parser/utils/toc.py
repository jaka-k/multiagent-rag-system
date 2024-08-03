import xml.etree.ElementTree as ET

def parse_toc_ncx(toc_content):
    """
    Parses an NCX file to extract the second-level table of contents entries.
    """
    # Parse the XML content
    tree = ET.ElementTree(ET.fromstring(toc_content))
    root = tree.getroot()

    # Define the namespace
    ns = {'ncx': 'http://www.daisy.org/z3986/2005/ncx/'}

    def parse_nav_point(nav_point):
        """
        Parses a navPoint element and extracts second-level entries.
        """
        parent_label = nav_point.find('ncx:navLabel/ncx:text', ns).text
        children = nav_point.findall('ncx:navPoint', ns)

        result = []
        for child in children:
            child_label = child.find('ncx:navLabel/ncx:text', ns).text
            child_content = child.find('ncx:content', ns).attrib['src']
            child_play_order = int(child.attrib['playOrder'])
            result.append({
                'parent_label': parent_label,
                'label': child_label,
                'content': child_content,
                'playOrder': child_play_order
            })
        return result

    # Find the navMap and parse all first-level navPoints
    nav_map = root.find('ncx:navMap', ns)
    second_level_entries = []
    for nav_point in nav_map.findall('ncx:navPoint', ns):
        second_level_entries.extend(parse_nav_point(nav_point))

    return second_level_entries